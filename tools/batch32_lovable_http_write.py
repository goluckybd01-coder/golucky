#!/usr/bin/env python3
"""Fetch batch32 from Lovable HTTP MCP and write via mcp_immediate_write + stage."""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
STAGE = os.path.join(WORKSPACE, "tools/batch32_stage_and_write.py")
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
REF = os.environ.get("LOVABLE_REF", "9cc0a40bac6c3843550ef2d7e7c27d0bfca3d67c")


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
        [sys.executable, STAGE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return (r.stdout or "").strip()


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    written = failed = 0
    failures = []
    for path in paths:
        try:
            content = mcp_read(path)
            msg = write_one(path, content)
            written += 1
            print(msg)
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": written, "failed": failed, "failures": failures}, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
