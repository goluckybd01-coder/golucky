#!/usr/bin/env python3
import asyncio
import json
import os
import subprocess
import sys

try:
    import websockets
except ImportError:
    print("websockets not installed", file=sys.stderr)
    sys.exit(1)

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MCP_HTTP = os.environ.get("CURSOR_MCP_HTTP", "http://127.0.0.1:26054/mcp")
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")

PATHS = [
    "src/components/ui/select.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/dialog.tsx",
]


def mcp_ws_url():
    return MCP_HTTP.replace("http://", "ws://").replace("https://", "wss://")


def write_one(rel, content):
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr}", file=sys.stderr)
        return False
    print(r.stdout.strip())
    return True


async def main():
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
        headers["X-Cursor-Agent"] = "1"
    fixed = 0
    rid = 1
    async with websockets.connect(mcp_ws_url(), additional_headers=headers, max_size=50 * 1024 * 1024) as ws:
        await ws.send(json.dumps({
            "jsonrpc": "2.0", "id": rid,
            "method": "initialize",
            "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "restore-ui-ws", "version": "1.0"}},
        }))
        rid += 1
        await ws.recv()
        await ws.send(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}))
        for path in PATHS:
            req_id = rid
            rid += 1
            await ws.send(json.dumps({
                "jsonrpc": "2.0", "id": req_id, "method": "tools/call",
                "params": {"name": "read_file", "arguments": {"project_id": PROJECT, "path": path}},
            }))
            while True:
                raw = await ws.recv()
                for line in raw.splitlines():
                    if not line.startswith("data:"):
                        continue
                    data = json.loads(line[5:].strip())
                    if data.get("id") != req_id:
                        continue
                    text = next((c["text"] for c in data.get("result", {}).get("content", []) if c.get("type") == "text"), None)
                    if not text:
                        raise RuntimeError(f"empty: {path}")
                    if write_one(path, text):
                        fixed += 1
                    break
                else:
                    continue
                break
    print(f"FIXED_COUNT={fixed}")


if __name__ == "__main__":
    asyncio.run(main())
