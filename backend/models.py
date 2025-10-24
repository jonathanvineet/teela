from pathlib import Path
import json
from threading import Lock

BASE_DIR = Path(__file__).resolve().parent

# File paths
AGENTS_FILE = BASE_DIR / 'agents_metadata.json'
EVALUATIONS_FILE = BASE_DIR / 'agent_evaluations.json'
RENTALS_FILE = BASE_DIR / 'agent_rentals.json'
NONCES_FILE = BASE_DIR / 'nonces.json'
RENTAL_CONTRACTS_FILE = BASE_DIR / 'rental_contracts.json'
CHAT_STATS_FILE = BASE_DIR / 'agent_chat_stats.json'
ORCHESTRATIONS_FILE = BASE_DIR / 'orchestrations.json'

# Locks
_agents_lock = Lock()
_evaluations_lock = Lock()
_rentals_lock = Lock()
_nonces_lock = Lock()
_rental_contracts_lock = Lock()
_chat_stats_lock = Lock()
_orchestrations_lock = Lock()


def _load_json(path: Path):
    if not path.exists():
        return {}
    try:
        with path.open('r', encoding='utf8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_json(path: Path, data, lock: Lock):
    with lock:
        with path.open('w', encoding='utf8') as f:
            json.dump(data, f, indent=2)


def load_agents():
    return _load_json(AGENTS_FILE)


def save_agents(data):
    return _save_json(AGENTS_FILE, data, _agents_lock)


def load_evaluations():
    return _load_json(EVALUATIONS_FILE)


def save_evaluations(data):
    return _save_json(EVALUATIONS_FILE, data, _evaluations_lock)


def load_rentals():
    return _load_json(RENTALS_FILE)


def save_rentals(data):
    return _save_json(RENTALS_FILE, data, _rentals_lock)


def load_nonces():
    return _load_json(NONCES_FILE)


def save_nonces(data):
    return _save_json(NONCES_FILE, data, _nonces_lock)


def load_rental_contracts():
    return _load_json(RENTAL_CONTRACTS_FILE)


def save_rental_contracts(data):
    return _save_json(RENTAL_CONTRACTS_FILE, data, _rental_contracts_lock)


def load_chat_stats():
    return _load_json(CHAT_STATS_FILE)


def save_chat_stats(data):
    return _save_json(CHAT_STATS_FILE, data, _chat_stats_lock)


def load_orchestrations():
    return _load_json(ORCHESTRATIONS_FILE)


def save_orchestrations(data):
    return _save_json(ORCHESTRATIONS_FILE, data, _orchestrations_lock)
