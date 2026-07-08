#!/usr/bin/env python3
"""Bulk export pending files from Lovable via Cursor internal MCP websocket."""
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
PENDING_FILE = "/workspace/.export-tmp/pending_all.json"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26054/mcp")
BATCH_SIZE = 25


def load_pending_src():
    data = json.load(open(PENDING_FILE, encoding="utf-8"))
    paths = data.get("pending_src_paths") or []
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def load_pending_critical():
    data = json.load(open(PENDING_FILE, encoding="utf-8"))
    pending = data.get("pending") or []
    critical = []
    for p in pending:
        if p.startswith("supabase/migrations/") and p.endswith(".sql"):
            critical.append(p)
        elif p.startswith("scripts/"):
            critical.append(p)
        elif p in (
            "src/context/WalletContext.tsx",
            "src/lib/featureFlags.ts",
            "src/lib/supabaseClient.ts",
        ):
            critical.append(p)
    return [p for p in critical if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_file(rel: str, content: str) -> str:
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


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
                    {"project_id": PROJECT, "path": path},
                    rid,
                )
                rid += 1
                if not content or content.startswith("Lovable API error"):
                    raise RuntimeError(content or "empty")
                r = write_file(path, content)
                if r == "written":
                    written += 1
                    print(f"OK {path} ({len(content)} bytes)", flush=True)
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "src"
    if cmd == "status":
        src = load_pending_src()
        crit = load_pending_critical()
        print(json.dumps({"pending_src": len(src), "pending_critical": len(crit), "first_10_src": src[:10]}))
        return

    if cmd == "critical":
        paths = load_pending_critical()
    else:
        paths = load_pending_src()

    limit = int(sys.argv[2]) if len(sys.argv) > 2 else BATCH_SIZE
    batch = paths[:limit]
    if not batch:
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "pending_src": len(load_pending_src())}))
        return

    result = asyncio.run(export_paths(batch))
    result["pending_src"] = len(load_pending_src())
    result["pending_critical"] = len(load_pending_critical())
    print(json.dumps(result))


if __name__ == "__main__":
    main()
