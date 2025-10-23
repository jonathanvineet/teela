"""
Helper script to register an agent with the teela backend using a local private key.
This script demonstrates how to fetch a nonce, sign the canonical "Register agent" message,
and POST the registration payload to `/api/agent-register`.

Usage:
  pip install eth-account requests
  python agents/register_agent.py --private-key 0x... --agent-id financial-advisor --backend http://localhost:5001

Note: For a real wallet flow, the frontend uses wallet signature. This script uses a local
private key so it can be used in automated tests or CLI flows.
"""

import argparse
import requests
import json
from eth_account import Account
from eth_account.messages import encode_defunct


def get_nonce(backend_url, subject, purpose="register"):
    r = requests.get(f"{backend_url}/api/nonce", params={"subject": subject, "purpose": purpose})
    r.raise_for_status()
    return r.json().get("nonce")


def sign_register_message(private_key, agent_id, owner_address, nonce):
    acct = Account.from_key(private_key)
    message_text = f"Register agent:{agent_id}:{owner_address}:{nonce}"
    message = encode_defunct(text=message_text)
    signed = Account.sign_message(message, private_key)
    return signed.signature.hex()


def register_agent(backend_url, payload):
    r = requests.post(f"{backend_url}/api/agent-register", json=payload)
    try:
        r.raise_for_status()
    except Exception:
        print("Registration failed:", r.status_code, r.text)
        raise
    return r.json()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--private-key", required=True, help="0x... private key for owner (demo only)")
    p.add_argument("--agent-id", required=True)
    p.add_argument("--backend", default="http://localhost:5001")
    args = p.parse_args()

    acct = Account.from_key(args.private_key)
    owner = acct.address
    nonce = get_nonce(args.backend, owner, purpose="register")
    print("Nonce:", nonce)
    sig = sign_register_message(args.private_key, args.agent_id, owner, nonce)
    print("Signature:", sig)

    # load manifest and include fields
    with open('agents/financial_advisor_manifest.json','r',encoding='utf8') as f:
        manifest = json.load(f)

    payload = {
        "owner": owner,
        "agentId": args.agent_id,
        "domain": manifest.get('domain'),
        "description": manifest.get('description'),
        "manifestUrl": manifest.get('manifestUrl'),
        "scoringInputs": manifest.get('scoringInputs'),
        "nonce": nonce,
        "signature": sig
    }

    res = register_agent(args.backend, payload)
    print("Registration response:", res)
