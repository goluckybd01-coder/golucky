#!/usr/bin/env python3
"""Try websocket MCP ports with auth headers."""
import asyncio
import json
import os
import sys

try:
    import websockets
except ImportError:
    os.system(f"{sys.executable} -m pip install -q websockets")
    import websockets

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")

PORTS = [26053, 26054, 26055, 26056]


async def try_port(port):
    url = f"ws://127.0.0.1:{port}"
    headers = [("Authorization", f"Bearer {TOKEN}")] if TOKEN else None
    try:
        async with websockets.connect(url, subprotocols=["mcp"], additional_headers=headers, open_timeout=3) as ws:
            msg = {"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {
                "name": "read_file",
                "arguments": {"project_id": PROJECT, "path": "src/components/CoinRain.tsx"},
            }}
            await ws.send(json.dumps(msg))
            raw = await asyncio.wait_for(ws.recv(), timeout=10)
            data = json.loads(raw)
            if "error" in data:
                return port, f"error: {data['error']}"
            text = data.get("result", {}).get("content", [{}])[0].get("text", "")[:80]
            return port, f"OK: {text[:60]}..."
    except Exception as e:
        return port, str(e)


async def main():
    for port in PORTS:
        p, r = await try_port(port)
        print(f"port {p}: {r}")


asyncio.run(main())
