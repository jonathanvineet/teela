import os
import json
from flask import Flask, request, jsonify
import logging
from flask_cors import CORS
from dotenv import load_dotenv
from web3 import Web3
from utils import w3, get_eth_balance, get_erc20_balance, send_raw_signed_transaction
from pathlib import Path
from eth_account.messages import encode_defunct
from eth_account import Account
from threading import Lock
import requests
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
# Enable CORS for development (allow localhost origins)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:5000", "http://localhost:5001"]}})

# Configure logging
handler = logging.StreamHandler()
handler.setLevel(logging.DEBUG)
formatter = logging.Formatter('%(asctime)s %(levelname)s %(message)s')
handler.setFormatter(formatter)
app.logger.addHandler(handler)
app.logger.setLevel(logging.DEBUG)

# Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

# ETH balance
@app.route('/balance/<address>', methods=['GET'])
def balance(address):
    try:
        data = get_eth_balance(address)
        return jsonify({'address': address, 'balance': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# ERC20 balance
@app.route('/erc20/balance', methods=['GET'])
def erc20_balance():
    token = request.args.get('token')
    owner = request.args.get('owner')
    if not token or not owner:
        return jsonify({'error': 'token and owner query params required'}), 400
    try:
        data = get_erc20_balance(token, owner)
        return jsonify({'token': token, 'owner': owner, 'balance': data})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Send signed raw transaction
@app.route('/tx/send', methods=['POST'])
def tx_send():
    body = request.get_json() or {}
    raw = body.get('raw')
    if not raw:
        return jsonify({'error': 'raw signed tx hex required in body'}), 400
    try:
        tx_hash = send_raw_signed_transaction(raw)
        return jsonify({'txHash': tx_hash})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Convenience: sign & send using PRIVATE_KEY in .env (unsafe for production)
@app.route('/tx/sign_send', methods=['POST'])
def tx_sign_send():
    body = request.get_json() or {}
    to = body.get('to')
    value = int(body.get('value', 0))
    data = body.get('data', '')
    private_key = os.getenv('PRIVATE_KEY')
    if not private_key:
        return jsonify({'error': 'PRIVATE_KEY not set in environment'}), 500
    try:
        account = w3.eth.account.from_key(private_key)
        nonce = w3.eth.get_transaction_count(account.address)
        tx = {
            'to': to,
            'value': value,
            'gas': 21000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
            'chainId': int(os.getenv('CHAIN_ID', 1)),
            'data': data,
        }
        signed = w3.eth.account.sign_transaction(tx, private_key)
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)
        return jsonify({'txHash': w3.toHex(tx_hash)})
    except Exception as e:
        return jsonify({'error': str(e)}), 400

# Agent status endpoint
@app.route('/api/agent-status', methods=['GET'])
def agent_status():
    try:
        # Mocked agent status for now
        agent_info = {
            'name': 'TeelaAgent',
            'address': 'agent1qvtppcm6ewputkcrxufnta3talza72k3nhc0fh8da4zc2ukk82s3xn0m6nc',
            'online': True
        }
        return jsonify(agent_info)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Simple in-memory conversation store for dev/demo purposes
CONVERSATIONS = {}


# Rentals storage (simple file-backed JSON). Format: {agent_id_or_address: [user_address,...]}
RENTALS_FILE = Path(__file__).resolve().parent / 'agent_rentals.json'
_rentals_lock = Lock()


def _load_rentals():
    if not RENTALS_FILE.exists():
        return {}
    try:
        with RENTALS_FILE.open('r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_rentals(data):
    with _rentals_lock:
        with RENTALS_FILE.open('w', encoding='utf8') as f:
            json.dump(data, f, indent=2)


# Agents metadata storage (owners can register agents with metadata & scoring inputs)
AGENTS_FILE = Path(__file__).resolve().parent / 'agents_metadata.json'
_agents_lock = Lock()


def _load_agents():
    if not AGENTS_FILE.exists():
        return {}
    try:
        with AGENTS_FILE.open('r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_agents(data):
    with _agents_lock:
        with AGENTS_FILE.open('w', encoding='utf8') as f:
            json.dump(data, f, indent=2)


# Chat stats (simple counters per agent)
CHAT_STATS_FILE = Path(__file__).resolve().parent / 'agent_chat_stats.json'
_chat_stats_lock = Lock()


# Nonce store for replay protection: maps subject (owner or user) -> list of used nonces
NONCES_FILE = Path(__file__).resolve().parent / 'nonces.json'
_nonces_lock = Lock()


def _load_nonces():
    if not NONCES_FILE.exists():
        return {}
    try:
        with NONCES_FILE.open('r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_nonces(data):
    with _nonces_lock:
        with NONCES_FILE.open('w', encoding='utf8') as f:
            json.dump(data, f, indent=2)


@app.route('/api/nonce', methods=['GET'])
def get_nonce():
    """Issue a nonce for a subject (owner or user). Query params: subject=0x..&purpose=register|rent
    Returns { nonce: '<hex>' }
    """
    subject = (request.args.get('subject') or '').strip().lower()
    purpose = (request.args.get('purpose') or '').strip().lower()
    if not subject or not purpose:
        return jsonify({'error': 'subject and purpose query params required'}), 400
    # generate a nonce: use timestamp + random
    import secrets, time
    nonce = f"{int(time.time())}-{secrets.token_hex(8)}"
    app.logger.debug(f"Issuing nonce for subject={subject} purpose={purpose} nonce={nonce}")
    nonces = _load_nonces()
    lst = nonces.setdefault(subject, [])
    # store as issued but not yet used (we'll consider any nonce in list as used to simplify)
    lst.append(nonce)
    nonces[subject] = lst
    _save_nonces(nonces)
    return jsonify({'nonce': nonce})


def _load_chat_stats():
    if not CHAT_STATS_FILE.exists():
        return {}
    try:
        with CHAT_STATS_FILE.open('r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_chat_stats(data):
    with _chat_stats_lock:
        with CHAT_STATS_FILE.open('w', encoding='utf8') as f:
            json.dump(data, f, indent=2)


@app.route('/api/agent-listings', methods=['GET'])
def agent_listings():
    """Return a list of known agents and small metadata including price (demo)."""
    # Base demo listing
    listings = [
        {
            'name': 'TeelaAgent',
            'id': 'teela-agent',
            'address': 'agent1qvtppcm6ewputkcrxufnta3talza72k3nhc0fh8da4zc2ukk82s3xn0m6nc',
            'price': 0,
            'description': 'Demo agent for rentals',
            'domain': 'demo',
            'owner': None,
            'score': 'unscored'
        }
    ]

    # Merge in registered agents from agents_metadata.json
    agents_meta = _load_agents()
    for aid, meta in agents_meta.items():
        listings.append({
            'name': meta.get('agentId') or aid,
            'id': aid,
            'address': meta.get('address'),
            'price': meta.get('price', 0),
            'description': meta.get('description'),
            'domain': meta.get('domain'),
            'owner': meta.get('owner'),
            'manifestUrl': meta.get('manifestUrl'),
            'score': meta.get('score', 'unscored')
        })

    return jsonify({'listings': listings})


@app.route('/api/agent-upload', methods=['POST'])
def agent_upload():
    """Upload an agent's manifest and code. Expects multipart form with fields:
      - agentId (form)
      - manifest (file, JSON)
      - code (file, Python script)

    Saves files to the repo `agents/` directory using names:
      agents/{agentId}_manifest.json
      agents/{agentId}_agent.py

    Optionally publishes via local lab simulator if available and returns `manifestUrl`.
    """
    try:
        agent_id = (request.form.get('agentId') or '').strip()
        if not agent_id:
            return jsonify({'error': 'agentId form field required'}), 400

        manifest_file = request.files.get('manifest')
        code_file = request.files.get('code')

        if not manifest_file and not code_file:
            return jsonify({'error': 'manifest or code file required'}), 400

        agents_dir = Path(__file__).resolve().parent.parent / 'agents'
        agents_dir.mkdir(parents=True, exist_ok=True)

        manifest_path = agents_dir / f"{agent_id}_manifest.json"
        code_path = agents_dir / f"{agent_id}_agent.py"

        if manifest_file:
            filename = secure_filename(manifest_file.filename)
            manifest_data = manifest_file.read()
            # validate JSON
            try:
                manifest_json = json.loads(manifest_data)
            except Exception:
                app.logger.warning(f"agent_upload: invalid manifest JSON for agent_id={agent_id}")
                return jsonify({'error': 'manifest file is not valid JSON'}), 400
            # basic required fields
            if not manifest_json.get('name') or not (manifest_json.get('endpoint') or manifest_json.get('manifestUrl')):
                app.logger.warning(f"agent_upload: manifest missing required fields for agent_id={agent_id} manifest_keys={list(manifest_json.keys())}")
                return jsonify({'error': 'manifest missing required fields (name and endpoint/manifestUrl)'}), 400
            manifest_path.write_bytes(manifest_data)
            app.logger.info(f"agent_upload: saved manifest for agent_id={agent_id} to {manifest_path}")

        if code_file:
            filename = secure_filename(code_file.filename)
            code_data = code_file.read()
            code_path.write_bytes(code_data)
            app.logger.info(f"agent_upload: saved code for agent_id={agent_id} to {code_path}")

        # The manifest file will be served by the local lab simulator at this URL
        # (simulator reads agents/{agentId}_manifest.json)
        manifest_url = f"http://localhost:8100/agents/{agent_id}/manifest.json"
        publish_url = f"http://localhost:8100/agents/{agent_id}/publish"
        try:
            app.logger.debug(f"agent_upload: attempting to publish to lab simulator at {publish_url}")
            resp = requests.post(publish_url, timeout=2)
            if resp.ok:
                published = resp.json()
                app.logger.info(f"agent_upload: publish response for {agent_id}: {published}")
            else:
                published = {'error': 'publish failed', 'status': resp.status_code}
                app.logger.warning(f"agent_upload: publish failed status={resp.status_code} for {agent_id}")
        except Exception as ex:
            published = {'warning': 'lab simulator not available', 'exception': str(ex)}
            app.logger.warning(f"agent_upload: lab simulator not available: {ex}")

        return jsonify({'success': True, 'manifestUrl': manifest_url, 'published': published})
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/agent-register', methods=['POST'])
def agent_register():
    """Register agent metadata from the owner.

    Body: {
      owner: '0x..',
      agentId: 'teela-agent',
      domain: 'legal',
      description: '...',
      manifestUrl: 'http://...',
      scoringInputs: {...},
      signature: '0x...'
    }

    The owner must sign the message: "Register agent:{agentId}" and provide the signature.
    """
    try:
        body = request.get_json() or {}
        # keep the raw owner string as provided for canonical message building
        owner_raw = (body.get('owner') or '').strip()
        # normalized lowercased owner for nonce lookup and comparisons
        owner = owner_raw.lower()
        agent_id = (body.get('agentId') or '').strip()
        domain = body.get('domain')
        description = body.get('description')
        manifest = body.get('manifestUrl')
        scoring_inputs = body.get('scoringInputs')
        signature = (body.get('signature') or '').strip()

        app.logger.debug(f"agent_register: payload owner={owner_raw} agent_id={agent_id} manifest={manifest} nonce_present={'nonce' in body}")
        if not owner_raw or not agent_id or not signature:
            app.logger.warning(f"agent_register: missing required fields owner={owner_raw} agent_id={agent_id} signature_present={bool(signature)}")
            return jsonify({'error': 'owner, agentId and signature are required'}), 400

        # Require nonce for replay protection
        nonce = (body.get('nonce') or '').strip()
        if not nonce:
            return jsonify({'error': 'nonce required'}), 400

        # Verify nonce was issued and consume it
        nonces = _load_nonces()
        # nonces are stored keyed by normalized lowercase subject
        subject_nonces = nonces.get(owner, [])
        if nonce not in subject_nonces:
            app.logger.warning(f"agent_register: invalid or missing nonce for owner={owner_raw} nonce={nonce} known_nonces={subject_nonces}")
            return jsonify({'error': 'invalid or missing nonce'}), 400
        # consume
        try:
            subject_nonces.remove(nonce)
            nonces[owner] = subject_nonces
            _save_nonces(nonces)
        except Exception:
            pass

        # Build the canonical message using the exact owner string the client used to sign (owner_raw)
        message_text = f"Register agent:{agent_id}:{owner_raw}:{nonce}"
        app.logger.debug(f"agent_register: canonical_message='{message_text}' signature={signature}")
        message = encode_defunct(text=message_text)
        try:
            recovered = Account.recover_message(message, signature=signature)
        except Exception as ex:
            app.logger.warning(f"agent_register: signature recover error: {ex}")
            return jsonify({'error': 'signature recovery error', 'exception': str(ex)}), 400
        app.logger.info(f"agent_register: recovered={recovered} expected_owner={owner}")
        # Compare recovered address to normalized owner (lowercase) to be robust to checksum differences
        if recovered.lower() != owner:
            app.logger.warning(f"agent_register: signature verification failed for agent_id={agent_id} recovered={recovered} expected={owner_raw}")
            return jsonify({'error': 'signature verification failed', 'recovered': recovered}), 400

        agents = _load_agents()
        aid = agent_id.lower()
        agents[aid] = {
            'agentId': agent_id,
            'owner': owner,
            'domain': domain,
            'description': description,
            'manifestUrl': manifest,
            'scoringInputs': scoring_inputs,
            # owner-supplied address/metadata optional; we can record address later
            'address': agents.get(aid, {}).get('address'),
            'price': agents.get(aid, {}).get('price', 0),
            'score': agents.get(aid, {}).get('score', 50),
            'rentCount': agents.get(aid, {}).get('rentCount', 0),
            'chatCount': agents.get(aid, {}).get('chatCount', 0)
        }
        _save_agents(agents)
        return jsonify({'success': True, 'agent': agents[aid]})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agent-permission', methods=['GET'])
def agent_permission():
    """Check if user is permitted to access the agent (rented).

    Query params: user=0x..., agent=agent-id-or-address
    """
    user = (request.args.get('user') or '').lower()
    agent = (request.args.get('agent') or '').lower()
    if not user or not agent:
        return jsonify({'error': 'user and agent query params required'}), 400
    rentals = _load_rentals()
    permitted = False
    for k, v in rentals.items():
        if k.lower() == agent:
            permitted = user in [u.lower() for u in v]
            break
    return jsonify({'permitted': permitted})


@app.route('/api/agent-rent', methods=['POST'])
def agent_rent():
    """Record a rental after verifying the user's signature.

    Body: {agent: 'teela-agent', user: '0x...', signature: '0x...'}
    The message to be signed is: "Rent agent:{agent}" (exactly)
    """
    try:
        body = request.get_json() or {}
        agent = (body.get('agent') or '').strip()
        user = (body.get('user') or '').strip().lower()
        signature = (body.get('signature') or '').strip()

        if not agent or not user or not signature:
            return jsonify({'error': 'agent, user, and signature required'}), 400

        # require nonce for rent signing
        nonce = (body.get('nonce') or '').strip()
        if not nonce:
            return jsonify({'error': 'nonce required'}), 400

        nonces = _load_nonces()
        subject_nonces = nonces.get(user, [])
        if nonce not in subject_nonces:
            app.logger.warning(f"agent_rent: invalid or missing nonce for user={user} nonce={nonce} known_nonces={subject_nonces}")
            return jsonify({'error': 'invalid or missing nonce'}), 400
        try:
            subject_nonces.remove(nonce)
            nonces[user] = subject_nonces
            _save_nonces(nonces)
        except Exception:
            pass

        message_text = f"Rent agent:{agent}:{user}:{nonce}"
        app.logger.debug(f"agent_rent: canonical_message='{message_text}' signature={signature}")
        message = encode_defunct(text=message_text)
        try:
            recovered = Account.recover_message(message, signature=signature)
        except Exception as ex:
            app.logger.warning(f"agent_rent: signature recover error: {ex}")
            return jsonify({'error': 'signature recovery error', 'exception': str(ex)}), 400
        if recovered.lower() != user.lower():
            app.logger.warning(f"agent_rent: signature verification failed for agent={agent} user={user} recovered={recovered}")
            return jsonify({'error': 'signature verification failed', 'recovered': recovered}), 400

        rentals = _load_rentals()
        lst = rentals.setdefault(agent, [])
        if user not in [u.lower() for u in lst]:
            lst.append(user)
            rentals[agent] = lst
            _save_rentals(rentals)

        # update agent metadata rentCount if agent is registered
        try:
            agents = _load_agents()
            aid = agent.lower()
            if aid in agents:
                agents[aid]['rentCount'] = agents[aid].get('rentCount', 0) + 1
                _save_agents(agents)
        except Exception:
            pass

        return jsonify({'success': True, 'agent': agent, 'user': user})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agent-chat', methods=['POST'])
def agent_chat():
    """Accept a chat message from a user and return an agent response.

    Body: {"from": "0x..." , "agent": "TeelaAgent", "message": "hello"}
    This is a simple synchronous demo implementation that stores the conversation
    in memory and returns a generated reply. Replace with real agent integration
    in production.
    """
    try:
        body = request.get_json() or {}
        user = (body.get('from') or body.get('user') or 'anonymous').lower()
        message = body.get('message', '')
        agent = body.get('agent', 'TeelaAgent')

        if not message:
            app.logger.warning(f"agent_chat: missing message from user={user} agent={agent}")
            return jsonify({'error': 'message required'}), 400
        app.logger.debug(f"agent_chat: user={user} agent={agent} message={message}")

        # append user message
        conv = CONVERSATIONS.setdefault(user, [])
        conv.append({'role': 'user', 'text': message})

        # SIMPLE AGENT LOGIC (placeholder)
        # For a real implementation, forward to your agent runtime (uagents) and await response
        reply_text = f"{agent}: I received your message: '{message}'"
        structured = {'type': 'text', 'content': reply_text}

        # append agent reply
        conv.append({'role': 'agent', 'text': reply_text})

        # Increment chat stats for this agent
        try:
            stats = _load_chat_stats()
            astats = stats.setdefault(agent.lower(), {'chatCount': 0})
            astats['chatCount'] = astats.get('chatCount', 0) + 1
            stats[agent.lower()] = astats
            _save_chat_stats(stats)
            # also update agents metadata chatCount if present
            agents = _load_agents()
            aid = agent.lower()
            if aid in agents:
                agents[aid]['chatCount'] = agents[aid].get('chatCount', 0) + 1
                _save_agents(agents)
        except Exception:
            pass

        return jsonify({'reply': reply_text, 'structured': structured})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agent-chat/history', methods=['GET'])
def agent_chat_history():
    user = (request.args.get('user') or 'anonymous').lower()
    conv = CONVERSATIONS.get(user, [])
    return jsonify({'history': conv})



@app.route('/api/agent-score', methods=['POST', 'GET'])
def agent_score():
    """Compute or return a simple heuristic score for an agent.

    POST with JSON { agent: 'agent-id' } will compute and persist a score.
    GET with query ?agent=... will return the current stored score.
    """
    try:
        if request.method == 'GET':
            agent = (request.args.get('agent') or '').lower()
            if not agent:
                return jsonify({'error': 'agent query param required'}), 400
            agents = _load_agents()
            score = agents.get(agent, {}).get('score', 'unscored')
            return jsonify({'agent': agent, 'score': score})

        body = request.get_json() or {}
        agent = (body.get('agent') or '').lower()
        if not agent:
            return jsonify({'error': 'agent required in body'}), 400

        agents = _load_agents()
        meta = agents.get(agent)
        if not meta:
            return jsonify({'error': 'agent not found'}), 404

        # Simple mock scoring heuristic:
        # base score 50, + length(description) % 50, - 5 * number of words 'TODO' occurrences
        base = 50
        desc = (meta.get('description') or '')
        bonus = min(40, len(desc)) if desc else 0
        penalty = desc.lower().count('todo') * 5
        computed = max(0, min(100, base + bonus - penalty))
        meta['score'] = computed
        agents[agent] = meta
        _save_agents(agents)
        return jsonify({'agent': agent, 'score': computed})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agent-owner-stats', methods=['GET'])
def agent_owner_stats():
    """Return owner dashboard stats: list agents owned by owner and rent/chat counts and score."""
    owner = (request.args.get('owner') or '').strip().lower()
    if not owner:
        return jsonify({'error': 'owner query param required'}), 400
    try:
        agents = _load_agents()
        rentals = _load_rentals()
        chat_stats = _load_chat_stats()

        results = []
        for aid, meta in agents.items():
            if (meta.get('owner') or '').lower() != owner:
                continue
            rent_count = len(rentals.get(aid, []))
            chat_count = chat_stats.get(aid, {}).get('chatCount', meta.get('chatCount', 0))
            results.append({
                'agentId': meta.get('agentId') or aid,
                'domain': meta.get('domain'),
                'description': meta.get('description'),
                'score': meta.get('score', 'unscored'),
                'rentCount': rent_count,
                'chatCount': chat_count,
            })

        return jsonify({'owner': owner, 'agents': results})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
