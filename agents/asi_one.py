"""Simple ASI:One adapter helpers.

This module implements minimal helpers to register and forward messages to an
ASI:One-compatible HTTP endpoint. It's intentionally small and defensive: the
agent only attempts to call the ASI endpoint if the `ASI_ONE_ENDPOINT`
environment variable is set.

The ASI API surface is assumed to be simple JSON POST endpoints. Adjust the
paths/behavior to match the real ASI:One implementation you will use.
"""
from __future__ import annotations

import os
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("asi_one")

ASI_ONE_ENDPOINT = os.environ.get("ASI_ONE_ENDPOINT")


async def register_with_asi(agent_info: Dict[str, Any]) -> bool:
    """Register this agent with the ASI:One endpoint.

    Returns True on success, False if no endpoint configured or on error.
    """
    if not ASI_ONE_ENDPOINT:
        logger.debug("ASI_ONE_ENDPOINT not set; skipping registration")
        return False

    url = f"{ASI_ONE_ENDPOINT.rstrip('/')}/register"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=agent_info)
            resp.raise_for_status()
            logger.info("Registered with ASI:One")
            return True
    except Exception as e:
        logger.exception("Failed to register with ASI:One: %s", e)
        return False


async def forward_incoming(sender: str, payload: Dict[str, Any]) -> bool:
    """Forward an incoming message to ASI:One for logging/relay.

    This is a convenience function — how you forward messages to ASI:One
    depends on the ASI contract. Modify as needed.
    """
    if not ASI_ONE_ENDPOINT:
        return False

    url = f"{ASI_ONE_ENDPOINT.rstrip('/')}/incoming"
    body = {"sender": sender, "payload": payload}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=body)
            resp.raise_for_status()
            logger.debug("Forwarded incoming message to ASI:One")
            return True
    except Exception:
        logger.exception("Failed to forward incoming message to ASI:One")
        return False
