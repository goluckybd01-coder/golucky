#!/usr/bin/env python3
"""Fetch batch32 via MCP WebSocket broker and write via mcp_immediate_write.py."""
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
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_HTTP = os.environ.get("CURSOR_MCP_HTTP", "http://127.0.0.1:26054/mcp")
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")


def mcp_ws_url():
    return MCP_HTTP.replace("http://", "ws://").replace("https://", "wss://")


def write_one(rel: str, content: str) -> bool:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
        return False
    print(r.stdout.strip())
    return True


async def mcp_session(paths: list[str]) -> dict:
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
        headers["X-Cursor-Agent"] = "1"

    written = failed = 0
    failures = []
    rid = 1

    async with websockets.connect(mcp_ws_url(), additional_headers=headers, max_size=50 * 1024 * 1024) as ws:
        init = {
            "jsonrpc": "2.0",
            "id": rid,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "batch32-ws-write", "version": "1.0"},
            },
        }
        rid += 1
        await ws.send(json.dumps(init))
        await ws.recv()
        await ws.send(json.dumps({"jsonrpc": "2.0", "method": "notifications/initialized"}))

        for path in paths:
            req_id = rid
            rid += 1
            await ws.send(json.dumps({
                "jsonrpc": "2.0",
                "id": req_id,
                "method": "tools/call",
                "params": {
                    "name": "read_file",
                    "arguments": {"project_id": PROJECT, "path": path, "ref": REF},
                },
            }))
            while True:
                raw = await ws.recv()
                for line in raw.splitlines():
                    if not line.startswith("data:"):
                        continue
                    data = json.loads(line[5:].strip())
                    if data.get("id") != req_id:
                        continue
                    if "error" in data:
                        raise RuntimeError(str(data["error"]))
                    text = None
                    for c in data.get("result", {}).get("content", []):
                        if c.get("type") == "text":
                            text = c["text"]
                    if not text:
                        raise RuntimeError(f"empty content for {path}")
                    if write_one(path, text):
                        written += 1
                    else:
                        failed += 1
                        failures.append({"path": path, "error": "write failed"})
                    break
                else:
                    continue
                break

    return {"written": written, "failed": failed, "total": len(paths), "failures": failures}


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    result = asyncio.run(mcp_session(paths))
    print(json.dumps(result))
    return 0 if result["failed"] == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
