#!/usr/bin/env python3
"""Export batch_40_80 missing paths via MCP websocket + mcp_immediate_write.py"""
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
WRITE = "/workspace/tools/mcp_immediate_write.py"
PATHS_FILE = "/workspace/.export-tmp/batch_40_80.json"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26054/mcp")


def load_missing():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_via_tool(rel, content):
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
        raw = await asyncio.wait_for(ws.recv(), timeout=120)
        data = json.loads(raw)
        if data.get("id") == req_id:
            if "error" in data:
                raise RuntimeError(data["error"])
            result = data.get("result", {})
            for c in result.get("content", []):
                if c.get("type") == "text":
                    return c["text"]
            raise RuntimeError("no text content")


async def export_all(paths):
    written = skipped = failed = 0
    failures = []
    headers = []
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")
    if token:
        headers = [("Authorization", f"Bearer {token}"), ("X-Cursor-Agent", "1")]
    async with websockets.connect(MCP_URL, subprotocols=["mcp"], additional_headers=headers) as ws:
        rid = 1
        for path in paths:
            if os.path.isfile(os.path.join(WORKSPACE, path)):
                skipped += 1
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
                written += 1
                print(msg, flush=True)
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    missing = load_missing()
    if not missing:
        print(json.dumps({
            "written": 0,
            "skipped": len(paths),
            "failed": 0,
            "failures": [],
            "total": len(paths),
        }))
        return
    result = asyncio.run(export_all(missing))
    result["total"] = len(paths)
    result["on_disk"] = len([p for p in paths if os.path.isfile(os.path.join(WORKSPACE, p))])
    result["still_missing"] = load_missing()
    print(json.dumps(result))


if __name__ == "__main__":
    main()
