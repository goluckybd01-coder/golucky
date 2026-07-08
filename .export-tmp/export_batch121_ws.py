#!/usr/bin/env python3
"""Export batch121 (paths 121-end) via MCP websocket + mcp_immediate_write.py"""
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
WRITE = "/workspace/tools/mcp_immediate_write.py"
PATHS_FILE = "/workspace/.export-tmp/batch121_paths.json"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26053")


def load_paths():
    return json.load(open(PATHS_FILE))


def write_via_tool(rel, content):
    r = subprocess.run(
        ["python3", WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return r.stdout.strip()


async def mcp_call(ws, name, arguments, req_id):
    msg = {"jsonrpc": "2.0", "id": req_id, "method": "tools/call", "params": {"name": name, "arguments": arguments}}
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
    async with websockets.connect(MCP_URL, subprotocols=["mcp"]) as ws:
        rid = 1
        for path in paths:
            if os.path.isfile(os.path.join(WORKSPACE, path)):
                skipped += 1
                continue
            try:
                content = await mcp_call(ws, "read_file", {"project_id": PROJECT, "path": path}, rid)
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
    paths = load_paths()
    missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    if not missing:
        print(json.dumps({"written": 0, "skipped": len(paths), "failed": 0, "failures": [], "total": len(paths)}))
        return
    result = asyncio.run(export_all(missing))
    result["total"] = len(paths)
    result["remaining"] = len([p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps(result))


if __name__ == "__main__":
    main()
