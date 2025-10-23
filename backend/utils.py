import os
from decimal import Decimal
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

WEB3_PROVIDER_URL = os.getenv('WEB3_PROVIDER_URL')
CHAIN_ID = int(os.getenv('CHAIN_ID') or 1)

if not WEB3_PROVIDER_URL:
    raise RuntimeError('WEB3_PROVIDER_URL not set in environment')

w3 = Web3(Web3.HTTPProvider(WEB3_PROVIDER_URL))

ERC20_ABI = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    },
    {
        "constant": True,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function",
    },
]


def get_eth_balance(address: str) -> dict:
    try:
        checksum = w3.to_checksum_address(address)
    except Exception:
        raise
    wei = w3.eth.get_balance(checksum)
    ether = w3.from_wei(wei, 'ether')
    return {"wei": str(wei), "ether": str(Decimal(ether))}


def get_erc20_balance(token_address: str, owner_address: str) -> dict:
    token = w3.eth.contract(address=w3.toChecksumAddress(token_address), abi=ERC20_ABI)
    balance = token.functions.balanceOf(w3.toChecksumAddress(owner_address)).call()
    try:
        decimals = token.functions.decimals().call()
    except Exception:
        decimals = 18
    human = Decimal(balance) / (Decimal(10) ** decimals)
    return {"balance": str(balance), "decimals": decimals, "human": str(human)}


def send_raw_signed_transaction(signed_tx_hex: str) -> str:
    tx_hash = w3.eth.send_raw_transaction(bytes.fromhex(signed_tx_hex.replace('0x','')))
    return w3.toHex(tx_hash)
