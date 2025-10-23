import os
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv
from web3 import Web3
from utils import w3, get_eth_balance, get_erc20_balance, send_raw_signed_transaction

load_dotenv()

app = Flask(__name__)

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
