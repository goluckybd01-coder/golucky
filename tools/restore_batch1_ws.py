#!/usr/bin/env python3
"""Fetch batch 1 corrupted files (self-import) from Lovable via MCP WebSocket and write via mcp_immediate_write."""
import asyncio
import json
import os
import subprocess
import sys

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "786c41f70907f7f4683b7d6ef61fe2ec4b995dbe"
WRITE = "/workspace/tools/mcp_immediate_write.py"

PATHS = [
    "src/components/admin/AdminAgentManagement.tsx",
    "src/components/admin/GameRevenueChart.tsx",
    "src/components/admin/TransactionStatsChart.tsx",
    "src/components/admin/UserActivityChart.tsx",
    "src/components/admin/UserRegistrationChart.tsx",
    "src/components/admin/UserRetentionChart.tsx",
    "src/components/admin/VIPDistributionChart.tsx",
    "src/components/agent/AgentCommissionAnalytics.tsx",
    "src/components/agent/AgentCommissionWithdrawHistory.tsx",
    "src/components/agent/AgentLeaderboard.tsx",
    "src/components/agent/AgentMilestoneRewards.tsx",
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
                "clientInfo": {"name": "restore-batch1", "version": "1.0"},
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


def write_one(path, content):
    r = subprocess.run(
        [sys.executable, WRITE, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def main():
    results = asyncio.run(fetch_all())
    written = 0
    for path in PATHS:
        msg = write_one(path, results[path])
        written += 1
        print(msg)
    print(json.dumps({"fixed": written, "written": written, "failed": 0, "total": len(PATHS)}))


if __name__ == "__main__":
    main()
