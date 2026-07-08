#!/usr/bin/env python3
"""Fetch 8 corrupted files from Lovable via Cursor MCP broker WebSocket and write via mcp_immediate_write."""
import asyncio
import json
import os
import subprocess
import sys

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "786c41f70907f7f4683b7d6ef61fe2ec4b995dbe"
WRITE = "/workspace/tools/mcp_immediate_write.py"
RAW = "/workspace/.export-tmp/mcp_raw"

PATHS = [
    "src/components/CommissionDetailsModal.tsx",
    "src/components/InvitationRulesModal.tsx",
    "src/components/ReferralShareCard.tsx",
    "src/components/SubordinateDataModal.tsx",
    "src/components/TransactionDetailsModal.tsx",
    "src/components/TransactionRequestForm.tsx",
    "src/components/admin/game-monitor/GameMonitorPanel.tsx",
    "src/pages/Popular.tsx",
]


async def fetch_all():
    try:
        import websockets
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "websockets", "-q"])
        import websockets

    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")
    ws_url = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26054/mcp")
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-Cursor-Agent"] = "1"

    results = {}
    async with websockets.connect(ws_url, additional_headers=headers) as ws:
        async def send(msg):
            await ws.send(json.dumps(msg))
            while True:
                raw = await ws.recv()
                data = json.loads(raw)
                if "id" in data and data.get("id") == msg.get("id"):
                    return data
                if "method" in data and data["method"] == "notifications/message":
                    continue

        await send({
            "jsonrpc": "2.0", "id": 1, "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "restore8", "version": "1.0"},
            },
        })
        await send({"jsonrpc": "2.0", "method": "notifications/initialized"})

        rid = 2
        for path in PATHS:
            data = await send({
                "jsonrpc": "2.0", "id": rid, "method": "tools/call",
                "params": {
                    "name": "read_file",
                    "arguments": {"project_id": PROJECT, "path": path, "ref": REF},
                },
            })
            rid += 1
            if "error" in data:
                raise RuntimeError(f"{path}: {data['error']}")
            text = None
            for c in data.get("result", {}).get("content", []):
                if c.get("type") == "text":
                    text = c["text"]
            if not text:
                raise RuntimeError(f"{path}: no content")
            results[path] = text
    return results


def write_one(rel, content):
    os.makedirs(RAW, exist_ok=True)
    name = os.path.basename(rel)
    with open(os.path.join(RAW, name), "w", encoding="utf-8") as f:
        f.write(content)
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def main():
    try:
        results = asyncio.run(fetch_all())
    except Exception as e:
        print(json.dumps({"error": str(e), "fixed": 0}), file=sys.stderr)
        return 1

    fixed = 0
    failures = []
    for path, content in results.items():
        try:
            msg = write_one(path, content)
            fixed += 1
            print(msg)
        except Exception as ex:
            failures.append({"path": path, "error": str(ex)})

    out = {"fixed": fixed, "total": len(PATHS), "failures": failures}
    print(json.dumps(out, indent=2))
    return 0 if fixed == len(PATHS) else 1


if __name__ == "__main__":
    raise SystemExit(main())
