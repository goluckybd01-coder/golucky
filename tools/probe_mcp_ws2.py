#!/usr/bin/env python3
import asyncio, json, os
import websockets

TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")
PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"

async def main():
    headers = [("Authorization", f"Bearer {TOKEN}"), ("X-Cursor-Agent", "1")]
    async with websockets.connect("ws://127.0.0.1:26054", subprotocols=["mcp"], additional_headers=headers) as ws:
        msg = {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"read_file","arguments":{"project_id":PROJECT,"path":"src/components/CoinRain.tsx"}}}
        await ws.send(json.dumps(msg))
        raw = await asyncio.wait_for(ws.recv(), timeout=15)
        print(raw[:500])

asyncio.run(main())
