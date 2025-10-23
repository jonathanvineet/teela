import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from web3 import Web3
from utils import w3, get_eth_balance, get_erc20_balance, send_raw_signed_transaction
from pathlib import Path
from eth_account.messages import encode_defunct
from eth_account import Account
from threading import Lock

load_dotenv()

app = Flask(__name__)
# Enable CORS for development (allow localhost origins)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:5000", "http://localhost:5001"]}})

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


@app.route('/api/agent-listings', methods=['GET'])
def agent_listings():
    """Return a list of known agents and small metadata including price (demo)."""
    listings = [
        {
            'name': 'TeelaAgent',
            'id': 'teela-agent',
            'address': 'agent1qvtppcm6ewputkcrxufnta3talza72k3nhc0fh8da4zc2ukk82s3xn0m6nc',
            'price': 0,
            'description': 'Demo agent for rentals'
        }
    ]
    return jsonify({'listings': listings})


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

        message_text = f"Rent agent:{agent}"
        message = encode_defunct(text=message_text)
        recovered = Account.recover_message(message, signature=signature)
        if recovered.lower() != user.lower():
            return jsonify({'error': 'signature verification failed', 'recovered': recovered}), 400

        rentals = _load_rentals()
        lst = rentals.setdefault(agent, [])
        if user not in [u.lower() for u in lst]:
            lst.append(user)
            rentals[agent] = lst
            _save_rentals(rentals)

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
            return jsonify({'error': 'message required'}), 400

        # append user message
        conv = CONVERSATIONS.setdefault(user, [])
        conv.append({'role': 'user', 'text': message})

        # SIMPLE AGENT LOGIC (placeholder)
        # For a real implementation, forward to your agent runtime (uagents) and await response
        reply_text = f"{agent}: I received your message: '{message}'"
        structured = {'type': 'text', 'content': reply_text}

        # append agent reply
        conv.append({'role': 'agent', 'text': reply_text})

        return jsonify({'reply': reply_text, 'structured': structured})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/agent-chat/history', methods=['GET'])
def agent_chat_history():
    user = (request.args.get('user') or 'anonymous').lower()
    conv = CONVERSATIONS.get(user, [])
    return jsonify({'history': conv})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
