#!/usr/bin/env python3
"""Re-fetch corrupted UI components from Lovable and write via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("CURSOR_MCP_HTTP", "http://127.0.0.1:26054/mcp")
TOKEN = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")

PATHS = [
    "src/components/ui/popover.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/alert.tsx",
    "src/components/ui/progress.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/dialog.tsx",
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


def mcp_initialize():
    post({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "initialize",
        "params": {
            "protocolVersion": "2024-11-05",
            "capabilities": {},
            "clientInfo": {"name": "restore-ui", "version": "1.0"},
        },
    })
    post({"jsonrpc": "2.0", "method": "notifications/initialized"})


def mcp_read(path, req_id):
    data = post({
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"project_id": PROJECT, "path": path},
        },
    })
    if "error" in data:
        raise RuntimeError(str(data["error"]))
    for c in data.get("result", {}).get("content", []):
        if c.get("type") == "text":
            return c["text"]
    raise RuntimeError(f"no text content for {path}")


def write_one(rel, content):
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError(f"write failed {rel}: {r.stderr}")
    print(r.stdout.strip())


def main():
    mcp_initialize()
    fixed = 0
    for i, path in enumerate(PATHS, start=2):
        content = mcp_read(path, i)
        if not content.strip():
            print(f"SKIP empty: {path}", file=sys.stderr)
            continue
        write_one(path, content)
        fixed += 1
    print(f"FIXED_COUNT={fixed}")


if __name__ == "__main__":
    main()
