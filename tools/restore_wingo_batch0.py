#!/usr/bin/env python3
"""Restore corrupted files indices 0-16 from Lovable MCP via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys
import urllib.request

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/wingo_corrupted.json")
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
CORRUPTED_MARKER = 'import PageScaffold from "@/components/templates/PageScaffold"'
WINGO_PATH = "src/pages/games/WinGo.tsx"


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
            "arguments": {"project_id": PROJECT_ID, "path": path},
        },
    }).encode()
    req = urllib.request.Request(MCP_URL, data=body, headers=mcp_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode()
    text = parse_mcp_text(raw)
    if not text or text.startswith("Lovable API error"):
        raise RuntimeError(text or "empty")
    return text


def write_file(rel: str, content: str) -> None:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout).strip())


def verify(rel: str) -> bool:
    full = os.path.join(WORKSPACE, rel)
    if not os.path.isfile(full):
        return False
    with open(full, encoding="utf-8") as f:
        content = f.read()
    if CORRUPTED_MARKER not in content:
        return True
    return rel == WINGO_PATH


def load_paths():
    with open(PATHS_FILE, encoding="utf-8") as f:
        lines = [ln.strip() for ln in f if ln.strip()]
    if lines and lines[0].isdigit():
        lines = lines[1:]
    paths = []
    for ln in lines:
        ln = ln.strip().rstrip(",").strip()
        if ln.startswith('"') and ln.endswith('"'):
            paths.append(json.loads(ln))
        elif ln in ("[", "]"):
            continue
    return paths


def main():
    paths = load_paths()[0:17]
    fixed = 0
    failures = []

    for rel in paths:
        try:
            content = mcp_read(rel)
            write_file(rel, content)
            if verify(rel):
                fixed += 1
                print(f"OK {rel}")
            else:
                failures.append({"path": rel, "error": "still contains PageScaffold import"})
                print(f"FAIL verify {rel}", file=sys.stderr)
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
            print(f"FAIL {rel}: {e}", file=sys.stderr)

    result = {"fixed": fixed, "total": len(paths), "failures": failures}
    print(json.dumps(result, indent=2))
    return 0 if fixed == len(paths) else 1


if __name__ == "__main__":
    sys.exit(main())
