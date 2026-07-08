#!/usr/bin/env python3
"""Fetch batch32 paths from Lovable MCP and write via mcp_immediate_write.py (always overwrite)."""
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
PATHS_FILE = "/workspace/.export-tmp/batch32_paths.json"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26054/mcp")


def write_file(rel: str, content: str) -> bool:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        print(f"WRITE_FAIL {rel}: {(r.stderr or r.stdout).strip()}", flush=True)
        return False
    print(r.stdout.strip(), flush=True)
    return True


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


async def export_paths(paths):
    written = failed = 0
    failures = []
    headers = []
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")
    if token:
        headers = [("Authorization", f"Bearer {token}"), ("X-Cursor-Agent", "1")]
    async with websockets.connect(MCP_URL, subprotocols=["mcp"], additional_headers=headers) as ws:
        rid = 1
        for path in paths:
            try:
                content = await mcp_call(
                    ws,
                    "read_file",
                    {"project_id": PROJECT, "path": path},
                    rid,
                )
                rid += 1
                if not content or content.startswith("Lovable API error"):
                    raise RuntimeError(content or "empty")
                if write_file(path, content):
                    written += 1
                else:
                    failed += 1
                    failures.append({"path": path, "error": "write failed"})
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "failed": failed, "failures": failures}


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    result = asyncio.run(export_paths(paths))
    result["total"] = len(paths)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
