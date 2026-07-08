#!/usr/bin/env python3
"""Export pending_src_paths slice [40:80] via MCP read_file + mcp_immediate_write.py"""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = os.environ.get("LOVABLE_REF", "9cc0a40bac6c3843550ef2d7e7c27d0bfca3d67c")
WORKSPACE = "/workspace"
PENDING_FILE = "/workspace/.export-tmp/pending_all.json"
WRITE_SCRIPT = "/workspace/tools/mcp_immediate_write.py"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")


def load_slice():
    data = json.load(open(PENDING_FILE, encoding="utf-8"))
    paths = data.get("pending_src_paths") or []
    missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    return missing[40:80]


def mcp_headers():
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["X-Cursor-Agent"] = "1"
    return headers


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
    try:
        data = json.loads(raw)
        for c in data.get("result", {}).get("content", []):
            if c.get("type") == "text":
                return c["text"]
    except json.JSONDecodeError:
        pass
    raise RuntimeError(f"unparseable MCP response: {raw[:200]}")


def mcp_read(path: str) -> str:
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"project_id": PROJECT_ID, "path": path, "ref": REF},
        },
    }).encode()
    req = urllib.request.Request(MCP_URL, data=body, headers=mcp_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode()
    text = parse_mcp_text(raw)
    if not text or text.startswith("Lovable API error"):
        raise RuntimeError(text or "empty")
    return text


def write_via_immediate(path: str, content: str) -> None:
    r = subprocess.run(
        ["python3", WRITE_SCRIPT, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "write failed").strip())


def main():
    paths = load_slice()
    written = 0
    failures = []
    for path in paths:
        try:
            content = mcp_read(path)
            write_via_immediate(path, content)
            print(f"OK {path} ({len(content)} bytes)", flush=True)
            written += 1
        except Exception as e:
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", flush=True)
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
