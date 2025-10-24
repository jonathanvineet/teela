import uuid
import threading
import time
import requests
import json
from models import load_orchestrations, save_orchestrations, load_agents, save_evaluations


class Orchestrator:
    """Simple in-process orchestrator that runs a sequence of agent calls
    and persists job state to a local JSON file (orchestrations.json).

    Job config example:
    {
      'owner': '0x..',
      'agents': ['agent-a', 'agent-b'],
      'prompt': 'Analyze customer tax situation',
      'aggregation': 'concat'  # or 'vote'
    }
    """

    def __init__(self):
        # load existing jobs
        self._jobs = load_orchestrations()
        self._lock = threading.Lock()

    def _persist(self):
        save_orchestrations(self._jobs)

    def create_job(self, owner: str, config: dict) -> str:
        job_id = str(uuid.uuid4())
        job = {
            'id': job_id,
            'owner': owner,
            'config': config,
            'status': 'queued',
            'created_at': int(time.time()),
            'updated_at': int(time.time()),
            'result': None,
            'logs': []
        }
        with self._lock:
            self._jobs[job_id] = job
            self._persist()

        # start async run
        t = threading.Thread(target=self._run_job, args=(job_id,), daemon=True)
        t.start()
        return job_id

    def get_job(self, job_id: str):
        return self._jobs.get(job_id)

    def _append_log(self, job_id: str, msg: str):
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            job['logs'].append({'ts': int(time.time()), 'msg': msg})
            job['updated_at'] = int(time.time())
            self._persist()

    def _run_job(self, job_id: str):
        with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return
            job['status'] = 'running'
            job['updated_at'] = int(time.time())
            self._persist()

        cfg = job['config'] or {}
        agents = cfg.get('agents') or []
        prompt = cfg.get('prompt') or cfg.get('prompts') or ''
        aggregation = cfg.get('aggregation') or 'concat'

        overall = {'steps': [], 'aggregation': aggregation}

        try:
            for aid in agents:
                self._append_log(job_id, f"Calling agent {aid}")
                # resolve manifest endpoint similar to existing evaluation logic
                manifest_url = f'http://localhost:8100/agents/{aid}/manifest.json'
                agent_endpoint = None
                try:
                    resp = requests.get(manifest_url, timeout=2)
                    if resp.ok:
                        m = resp.json()
                        agent_endpoint = m.get('endpoint') or m.get('chatEndpoint') or f'http://localhost:8100/agents/{aid}/test'
                except Exception as ex:
                    agent_endpoint = f'http://localhost:8100/agents/{aid}/test'

                step = {'agent': aid, 'endpoint': agent_endpoint, 'response': None, 'score': 0}
                try:
                    r = requests.post(agent_endpoint, json={'prompt': prompt}, timeout=6)
                    text = ''
                    try:
                        payload = r.json()
                        text = payload.get('reply') or payload.get('response') or json.dumps(payload)
                    except Exception:
                        text = r.text or ''
                    step['response'] = text
                    # naive scoring: non-empty response => score 100, else 0
                    step['score'] = 100 if text and len(text.strip()) > 0 else 0
                    overall['steps'].append(step)
                    self._append_log(job_id, f"Agent {aid} returned (len={len(text)}) score={step['score']}")
                except Exception as ex:
                    step['response'] = None
                    step['score'] = 0
                    overall['steps'].append(step)
                    self._append_log(job_id, f"Agent {aid} call failed: {ex}")

            # aggregate results
            if aggregation == 'concat':
                aggregated = '\n'.join([s['response'] or '' for s in overall['steps']])
            else:
                # default: concat
                aggregated = '\n'.join([s['response'] or '' for s in overall['steps']])

            overall['aggregated'] = aggregated
            overall['score'] = int(sum(s['score'] for s in overall['steps']) / max(1, len(overall['steps'])))

            # persist result in job
            with self._lock:
                job = self._jobs.get(job_id)
                job['status'] = 'completed'
                job['result'] = overall
                job['updated_at'] = int(time.time())
                self._persist()

            # also persist a synthetic evaluation entry for the orchestrator run
            try:
                eval_entry = {
                    'agentId': 'orchestration-' + job_id,
                    'timestamp': int(time.time()),
                    'score': overall['score'],
                    'results': overall
                }
                # save via save_evaluations (callable imported)
                try:
                    save_evaluations({eval_entry['agentId']: [eval_entry]})
                except Exception:
                    pass
            except Exception:
                pass

        except Exception as ex:
            with self._lock:
                job = self._jobs.get(job_id)
                if job:
                    job['status'] = 'failed'
                    job['updated_at'] = int(time.time())
                    job.setdefault('error', str(ex))
                    self._persist()
            self._append_log(job_id, f"Orchestration failed: {ex}")


_GLOBAL_ORCH = None


def get_orchestrator():
    global _GLOBAL_ORCH
    if _GLOBAL_ORCH is None:
        _GLOBAL_ORCH = Orchestrator()
    return _GLOBAL_ORCH
