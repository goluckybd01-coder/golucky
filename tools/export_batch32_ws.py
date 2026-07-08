#!/usr/bin/env python3
"""Export batch32 via local MCP websocket with proper initialize handshake."""
import asyncio
import json
import os
import subprocess
import sys

try:
    import websockets
except ImportError:
    os.system(f"{sys.executable} -m pip install -q websockets")
    import websockets

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = "ws://127.0.0.1:26054/mcp"
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")


def write_one(rel: str, content: str) -> None:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    print(r.stdout.strip())


async def recv_for_id(ws, req_id, timeout=180):
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        data = json.loads(raw)
        if data.get("id") == req_id:
            if "error" in data:
                raise RuntimeError(str(data["error"]))
            return data.get("result", {})


async def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    headers = []
    if TOKEN:
        headers = [("Authorization", f"Bearer {TOKEN}"), ("X-Cursor-Agent", "1")]

    written = 0
    failures = []
    async with websockets.connect(MCP_URL, subprotocols=["mcp"], additional_headers=headers) as ws:
        rid = 1
        init = {
            "jsonrpc": "2.0",
            "id": rid,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "batch32-export", "version": "1.0"},
            },
        }
        await ws.send(json.dumps(init))
        await recv_for_id(ws, rid)
        rid += 1
        await ws.send(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}))

        for path in paths:
            try:
                msg = {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "method": "tools/call",
                    "params": {
                        "name": "read_file",
                        "arguments": {"project_id": PROJECT, "path": path},
                    },
                }
                await ws.send(json.dumps(msg))
                result = await recv_for_id(ws, rid)
                rid += 1
                text = None
                for c in result.get("content", []):
                    if c.get("type") == "text":
                        text = c["text"]
                        break
                if not text or text.startswith("Lovable API error"):
                    raise RuntimeError(text or "empty")
                write_one(path, text)
                written += 1
            except Exception as e:
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)

    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
