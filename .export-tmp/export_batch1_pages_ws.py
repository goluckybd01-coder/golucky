#!/usr/bin/env python3
"""Export batch1 pages via local Cursor MCP websocket."""
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
WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch1_pages.json"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26053")


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


async def main():
    paths = json.load(open(BATCH_FILE))
    written = []
    failed = []
    rid = 1
    async with websockets.connect(MCP_URL, subprotocols=["mcp"]) as ws:
        for path in paths:
            try:
                text = await mcp_call(ws, "read_file", {"project_id": PROJECT, "path": path}, rid)
                rid += 1
                if not text or text.startswith("Lovable API error"):
                    failed.append(path)
                    continue
                write_file(path, text)
                written.append(path)
                print(f"OK {path} ({len(text)} bytes)", file=sys.stderr)
            except Exception as e:
                failed.append(path)
                print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))


if __name__ == "__main__":
    asyncio.run(main())
