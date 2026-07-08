#!/usr/bin/env python3
"""Export missing batch_40_80 paths via HTTP MCP + mcp_immediate_write.py"""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = "b4906a5c0e34d0a1506f50999eb5f9703ebb698e"
WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_40_80.json"
STAGING = "/workspace/.export-tmp/staging_batch40"
WRITE_SCRIPT = "/workspace/tools/mcp_immediate_write.py"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")


def load_missing():
    paths = json.load(open(BATCH, encoding="utf-8"))
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


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
    raise RuntimeError(f"unparseable MCP response: {raw[:300]}")


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


def write_file(path: str, content: str) -> None:
    os.makedirs(STAGING, exist_ok=True)
    stage = os.path.join(STAGING, path.replace("/", "__"))
    with open(stage, "w", encoding="utf-8") as f:
        f.write(content)
    r = subprocess.run(
        [sys.executable, WRITE_SCRIPT, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout or "write failed").strip())


def main():
    paths = load_missing()
    written = []
    failures = []
    for path in paths:
        try:
            content = mcp_read(path)
            write_file(path, content)
            print(f"OK {path} ({len(content)} bytes)", flush=True)
            written.append(path)
        except Exception as e:
            failures.append({"path": path, "error": str(e)})
            print(f"FAIL {path}: {e}", flush=True)
    still = [p for p in json.load(open(BATCH)) if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "written_count": len(written),
        "written": written,
        "failed": len(failures),
        "failures": failures,
        "still_missing": still,
    }, indent=2))


if __name__ == "__main__":
    main()
