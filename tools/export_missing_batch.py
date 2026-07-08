#!/usr/bin/env python3
"""Export listed paths from Lovable via MCP websocket -> mcp_immediate_write.py"""
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
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch_missing_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("CURSOR_MCP_HTTP", "http://127.0.0.1:26054/mcp").replace("http://", "ws://").replace("https://", "wss://")
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


def extract_text(result: dict) -> str:
    content = result.get("content") or []
    parts = []
    for block in content:
        if isinstance(block, dict) and block.get("type") == "text":
            parts.append(block.get("text", ""))
    return "".join(parts)


async def recv_for_id(ws, req_id, timeout=180):
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=timeout)
        for line in raw.splitlines():
            payload = line[5:].strip() if line.startswith("data:") else line
            if not payload:
                continue
            try:
                data = json.loads(payload)
            except json.JSONDecodeError:
                continue
            if data.get("id") != req_id:
                continue
            if "error" in data:
                raise RuntimeError(str(data["error"]))
            return data.get("result", {})


async def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    headers = {}
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
        headers["X-Cursor-Agent"] = "1"

    written = 0
    failures = []
    async with websockets.connect(MCP_URL, additional_headers=dict(headers), max_size=50 * 1024 * 1024) as ws:
        rid = 1
        init = {
            "jsonrpc": "2.0",
            "id": rid,
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "missing-batch-export", "version": "1.0"},
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
                text = extract_text(result).strip()
                if not text or "Lovable API error" in text or "file_not_found" in text:
                    raise RuntimeError(text or "empty content")
                write_one(path, text)
                written += 1
            except Exception as e:
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", file=sys.stderr)

    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))
    return 0 if not failures else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
