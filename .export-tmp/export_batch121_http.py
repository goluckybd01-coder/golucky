#!/usr/bin/env python3
"""Export batch121 via Lovable HTTP MCP read_file + mcp_immediate_write.py"""
import json
import os
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
PATHS_FILE = "/workspace/.export-tmp/batch121_paths.json"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
CONCURRENCY = int(os.environ.get("BATCH121_CONCURRENCY", "6"))


def load_missing():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
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


def write_via_tool(path: str, content: str) -> None:
    r = subprocess.run(
        ["python3", WRITE, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    print(r.stdout.strip(), flush=True)


def export_batch(paths):
    written = skipped = failed = 0
    failures = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(mcp_read, p): p for p in paths}
        for fut in as_completed(futs):
            path = futs[fut]
            if os.path.isfile(os.path.join(WORKSPACE, path)):
                skipped += 1
                continue
            try:
                content = fut.result()
                write_via_tool(path, content)
                written += 1
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    missing = load_missing()
    if not missing:
        print(json.dumps({
            "written": 0,
            "skipped": len(paths),
            "failed": 0,
            "failures": [],
            "total": len(paths),
            "remaining": 0,
        }))
        return
    result = export_batch(missing)
    result["total"] = len(paths)
    result["remaining"] = len(load_missing())
    print(json.dumps(result))


if __name__ == "__main__":
    main()
