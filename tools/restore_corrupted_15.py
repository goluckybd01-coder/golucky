#!/usr/bin/env python3
"""Re-fetch 15 corrupted files from Lovable and write via mcp_immediate_write."""
import json
import os
import re
import subprocess
import sys
import urllib.request

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "786c41f70907f7f4683b7d6ef61fe2ec4b995dbe"
WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")

FILES = [
    "src/components/BottomNav.tsx",
    "src/components/CommissionDetailsModal.tsx",
    "src/components/Confetti.tsx",
    "src/components/InvitationRulesModal.tsx",
    "src/components/ReferralShareCard.tsx",
    "src/components/SubordinateDataModal.tsx",
    "src/components/TransactionDetailsModal.tsx",
    "src/components/TransactionRequestForm.tsx",
    "src/components/admin/AdminAgentCommissionOverview.tsx",
    "src/components/admin/AdminAviatorLiveMonitor.tsx",
    "src/components/admin/LiveBetsPanel.tsx",
    "src/components/admin/game-monitor/GameMonitorPanel.tsx",
    "src/pages/FixedDeposits.tsx",
    "src/pages/Popular.tsx",
    "src/pages/admin/MinesGameAdmin.tsx",
]

SELF_IMPORT = re.compile(
    r'^import\s+\w+\s+from\s+["\']@/(?:components|pages)(?:/[^"\']+)?/(\w+)["\']',
    re.M,
)
GARBAGE = 'import PageScaffold from "@/components/templates/PageScaffold"'


def mcp_headers():
    h = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN")
    if token:
        h["Authorization"] = f"Bearer {token}"
        h["X-Cursor-Agent"] = "1"
    return h


def parse_mcp_text(raw: str) -> str:
    for line in raw.splitlines():
        if line.startswith("data:"):
            try:
                data = json.loads(line[5:].strip())
                if "result" in data:
                    for c in data["result"].get("content", []):
                        if c.get("type") == "text":
                            return c["text"]
            except json.JSONDecodeError:
                pass
    data = json.loads(raw)
    for c in data.get("result", {}).get("content", []):
        if c.get("type") == "text":
            return c["text"]
    raise RuntimeError(f"unparseable MCP response: {raw[:200]}")


def mcp_read(path: str) -> str:
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"project_id": PROJECT, "path": path, "ref": REF},
        },
    }).encode()
    req = urllib.request.Request(MCP_URL, data=body, headers=mcp_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode()
    text = parse_mcp_text(raw)
    if not text or text.startswith("Lovable API error"):
        raise RuntimeError(text or "empty")
    return text


def write_one(rel: str, content: str) -> str:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def is_corrupted(rel: str, content: str) -> bool:
    if GARBAGE in content:
        return True
    stem = os.path.splitext(os.path.basename(rel))[0]
    for m in SELF_IMPORT.finditer(content):
        if m.group(1) == stem:
            return True
    return False


def main():
    fixed = 0
    failures = []
    for path in FILES:
        try:
            content = mcp_read(path)
            msg = write_one(path, content)
            full = os.path.join(WORKSPACE, path)
            with open(full, encoding="utf-8") as f:
                written = f.read()
            if is_corrupted(path, written):
                raise RuntimeError("still corrupted after write")
            fixed += 1
            print(msg)
        except Exception as e:
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)

    print(json.dumps({"fixed": fixed, "total": len(FILES), "failures": failures}, indent=2))
    return 0 if fixed == len(FILES) else 1


if __name__ == "__main__":
    sys.exit(main())
