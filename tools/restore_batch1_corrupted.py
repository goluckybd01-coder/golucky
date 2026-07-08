#!/usr/bin/env python3
"""Re-fetch batch 1 corrupted files (self-import) from Lovable and write via mcp_immediate_write."""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "786c41f70907f7f4683b7d6ef61fe2ec4b995dbe"
WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")

FILES = [
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


def headers():
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if TOKEN:
        h["Authorization"] = f"Bearer {TOKEN}"
        h["X-Cursor-Agent"] = "1"
    return h


def post(payload):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(MCP_URL, data=body, headers=headers(), method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode()
    for line in raw.splitlines():
        if line.startswith("data:"):
            return json.loads(line[5:].strip())
    return json.loads(raw)


def parse_text(data):
    if "error" in data:
        raise RuntimeError(str(data["error"]))
    for c in data.get("result", {}).get("content", []):
        if c.get("type") == "text":
            return c["text"]
    raise RuntimeError("no text content")


def mcp_init():
    post({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "batch1-restore", "version": "1.0"},
        },
    })
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})


def mcp_read(path):
    data = post({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"project_id": PROJECT, "path": path, "ref": REF},
        },
    })
    text = parse_text(data)
    if not text or text.startswith("Lovable API error"):
        raise RuntimeError(text or "empty")
    return text


def write_one(rel, content):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


import re

SELF_IMPORT = re.compile(
    r'^import\s+\w+\s+from\s+["\']@/(?:components|pages)(?:/[^"\']+)?/(\w+)["\']',
    re.M,
)


def self_import(rel: str, content: str) -> bool:
    stem = os.path.splitext(os.path.basename(rel))[0]
    for m in SELF_IMPORT.finditer(content):
        if m.group(1) == stem:
            return True
    return False


def main():
    fixed = failed = still_corrupt = 0
    failures = []
    for path in FILES:
        try:
            content = mcp_read(path)
            msg = write_one(path, content)
            with open(os.path.join(WORKSPACE, path), encoding="utf-8") as f:
                written = f.read()
            corrupt = self_import(path, written)
            if corrupt:
                still_corrupt += 1
                raise RuntimeError("still corrupted after write")
            fixed += 1
            print(msg)
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({
        "fixed": fixed,
        "still_corrupt": still_corrupt,
        "failed": failed,
        "total": len(FILES),
        "failures": failures,
    }))
    return 0 if fixed == len(FILES) else 1


if __name__ == "__main__":
    raise SystemExit(main())
