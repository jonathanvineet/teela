# Backend (Flask + Web3.py)

This small backend exposes a few endpoints to interact with the Ethereum network using Web3.py.

Quick start

1. Create a virtual environment and activate it (Python 3.8+):

   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   cp .env.example .env
   # edit .env and add your provider URL and private key (for send_example)
   export FLASK_APP=app.py
   flask run
   ```

Endpoints

- `GET /health` - returns a simple health check
- `GET /balance/<address>` - returns ETH balance (in wei and ether)
- `GET /erc20/balance?token=<token_address>&owner=<owner_address>` - returns ERC20 token balance
- `POST /tx/send` - send a raw signed transaction (body: {"to":"0x...","value": "1000000000000000000"})

Security

- Never commit your real private keys. Use `.env` and secrets management in production.
- For production use, run behind a production server (gunicorn/uvicorn) and add auth.

References

- Web3.py docs: https://web3py.readthedocs.io/
- Flask docs: https://flask.palletsprojects.com/
