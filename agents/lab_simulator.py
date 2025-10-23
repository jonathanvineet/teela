"""
Simple local 'Innovation Lab' simulator for the FinancialAdvisor agent.
This script runs a tiny Flask app (default port 8100) that serves:
  - GET /agents/<agentId>/manifest.json  -> returns the manifest JSON (overrides manifestUrl to point to this lab)
  - POST /agents/<agentId>/publish       -> marks the agent as published and returns public endpoints
  - POST /agents/<agentId>/test          -> forwards test payload to the agent logic (calls analyze_spending)
  - GET /agents/<agentId>/info           -> returns published agent info

Usage:
  pip install flask requests
  python agents/lab_simulator.py

This is a local simulator only and does not contact Fetch.ai services.
"""

import json
import os
import sys
from pathlib import Path
from flask import Flask, request, jsonify

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / 'financial_advisor_manifest.json'
PUBLISHED_DB = ROOT / 'published_agents.json'

app = Flask(__name__)


def _read_manifest():
    if not MANIFEST_PATH.exists():
        return None
    with MANIFEST_PATH.open('r', encoding='utf8') as f:
        return json.load(f)


def _load_published():
    if not PUBLISHED_DB.exists():
        return {}
    try:
        with PUBLISHED_DB.open('r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_published(data):
    with PUBLISHED_DB.open('w', encoding='utf8') as f:
        json.dump(data, f, indent=2)


@app.route('/agents/<agent_id>/manifest.json', methods=['GET'])
def manifest(agent_id):
    # Prefer per-agent manifest file uploaded to agents/{agentId}_manifest.json
    agent_manifest = Path(ROOT.parent) / f'agents/{agent_id}_manifest.json'
    if agent_manifest.exists():
        try:
            with agent_manifest.open('r', encoding='utf8') as f:
                m = json.load(f)
        except Exception:
            return jsonify({'error': 'failed to read agent manifest'}), 500
    else:
        m = _read_manifest()
        if not m:
            return jsonify({'error': 'manifest not found'}), 404

    # override manifestUrl to point to this lab's manifest endpoint
    m_copy = dict(m)
    m_copy['manifestUrl'] = f"http://localhost:8100/agents/{agent_id}/manifest.json"
    m_copy['agentId'] = agent_id
    return jsonify(m_copy)


@app.route('/agents/<agent_id>/publish', methods=['POST'])
def publish(agent_id):
    m = _read_manifest()
    if not m:
        return jsonify({'error': 'manifest not found'}), 404
    published = _load_published()
    entry = {
        'agentId': agent_id,
        'name': m.get('name'),
        'manifestUrl': f"http://localhost:8100/agents/{agent_id}/manifest.json",
        'endpoint': f"http://localhost:8100/agents/{agent_id}/test",
        'description': m.get('description'),
        'domain': m.get('domain')
    }
    published[agent_id] = entry
    _save_published(published)
    return jsonify({'success': True, 'published': entry})


@app.route('/agents/<agent_id>/info', methods=['GET'])
def info(agent_id):
    published = _load_published()
    entry = published.get(agent_id)
    if not entry:
        return jsonify({'error': 'not published'}), 404
    return jsonify(entry)


@app.route('/agents/<agent_id>/test', methods=['POST'])
def test_agent(agent_id):
    # This simulator calls the agent logic directly by importing the agent module
    # Prefer lightweight logic module for simulation (doesn't require uagents runtime)
    try:
        project_root = Path(__file__).resolve().parent.parent
        if str(project_root) not in sys.path:
            sys.path.insert(0, str(project_root))
        import importlib
        # Try standalone logic module first
        try:
            mod = importlib.import_module('agents.financial_advisor_logic')
        except Exception:
            # Fallback to importing the full uagents module if present
            mod = importlib.import_module('agents.financial_advisor_agent')
    except Exception as e:
        return jsonify({'error': 'failed to import agent module', 'detail': str(e)}), 500

    # Be tolerant when parsing request JSON: read raw body and attempt to decode
    raw = request.get_data(as_text=True)
    if not raw:
        body = {}
    else:
        try:
            body = json.loads(raw)
        except Exception as e:
            return jsonify({'error': 'Failed to decode JSON', 'detail': str(e), 'raw': raw}), 400
    spending_data = body.get('spending_data', [])
    try:
        if hasattr(mod, 'analyze_spending'):
            advice = mod.analyze_spending(spending_data)
            return jsonify({'reply': advice})
        else:
            return jsonify({'error': 'agent missing analyze_spending function'}), 500
    except Exception as e:
        return jsonify({'error': 'agent processing error', 'detail': str(e)}), 500


if __name__ == '__main__':
    print('Starting local Lab simulator on http://localhost:8100')
    print('Manifest path:', MANIFEST_PATH)
    app.run(host='0.0.0.0', port=8100, debug=True)
