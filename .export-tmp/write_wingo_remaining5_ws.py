#!/usr/bin/env python3
"""Write 5 remaining wingo files via MCP websocket + mcp_immediate_write.py"""
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
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
FETCH = "/workspace/.export-tmp/fetch_batch40"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26054/mcp")

PATHS = [
    "src/pages/GameHistory.tsx",
    "src/pages/Leaderboard.tsx",
    "src/pages/Announcement.tsx",
    "src/components/game/FiveDSlotMachine.tsx",
    "src/components/game/BetHistoryFilters.tsx",
]

CORRUPT_SIZES = {103439, 104180, 57243}


def is_corrupt(path: str) -> bool:
    full = os.path.join(WORKSPACE, path)
    if not os.path.isfile(full):
        return True
    sz = os.path.getsize(full)
    return sz in CORRUPT_SIZES or sz > 80000


def write_via_tool(rel, content):
    os.makedirs(FETCH, exist_ok=True)
    stage = os.path.join(FETCH, rel.replace("/", "__"))
    with open(stage, "w", encoding="utf-8") as f:
        f.write(content)
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return r.stdout.strip()


async def mcp_call(ws, name, arguments, req_id):
    msg = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    }
    await ws.send(json.dumps(msg))
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=180)
        data = json.loads(raw)
        if data.get("id") == req_id:
            if "error" in data:
                raise RuntimeError(data["error"])
            result = data.get("result", {})
            for c in result.get("content", []):
                if c.get("type") == "text":
                    return c["text"]
            raise RuntimeError("no text content")


async def main():
    written = []
    failures = []
    headers = []
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")
    if token:
        headers = [("Authorization", f"Bearer {token}"), ("X-Cursor-Agent", "1")]
    try:
        async with websockets.connect(MCP_URL, subprotocols=["mcp"], additional_headers=headers) as ws:
            rid = 1
            for path in PATHS:
                if not is_corrupt(path):
                    print(f"SKIP OK {path}", flush=True)
                    written.append(path)
                    continue
                try:
                    content = await mcp_call(
                        ws,
                        "read_file",
                        {"project_id": PROJECT, "path": path, "ref": REF},
                        rid,
                    )
                    rid += 1
                    if not content or content.startswith("Lovable API error"):
                        raise RuntimeError(content or "empty")
                    msg = write_via_tool(path, content)
                    print(msg, flush=True)
                    written.append(path)
                except Exception as e:
                    failures.append({"path": path, "error": str(e)})
                    print(f"FAIL {path}: {e}", flush=True)
    except Exception as e:
        failures.append({"path": "*", "error": str(e)})
        print(f"CONNECT FAIL: {e}", flush=True)
    print(json.dumps({"written": written, "failures": failures}, indent=2))
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    asyncio.run(main())
