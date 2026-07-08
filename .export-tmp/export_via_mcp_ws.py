#!/usr/bin/env python3
"""Export pending batch_2 files via Cursor internal MCP websocket."""
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
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26053")


def load_missing():
    paths = json.load(open(BATCH_FILE))
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


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
        # ignore notifications


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
                content = await mcp_call(ws, "read_file", {"project_id": PROJECT, "path": path, "ref": REF}, rid)
                rid += 1
                if not content or content.startswith("Lovable API error"):
                    raise RuntimeError(content or "empty")
                write_file(path, content)
                written += 1
                print(f"OK {path} ({len(content)} bytes)", flush=True)
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def main():
    missing = load_missing()
    if not missing:
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "pending": 0}))
        return
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else len(missing)
    result = asyncio.run(export_all(missing[:limit]))
    result["pending"] = len(load_missing())
    print(json.dumps(result))


if __name__ == "__main__":
    main()
