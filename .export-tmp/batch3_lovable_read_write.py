#!/usr/bin/env python3
"""
Read missing batch_3 paths via Lovable MCP (Cursor broker) and write to /workspace.
Uses the same auth path as CallMcpTool when CURSOR_AGENT_IDENTITY_BROKER_TOKEN works.
"""
import json
import os
import sys
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_3.json"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
CONCURRENCY = int(os.environ.get("BATCH3_CONCURRENCY", "4"))


def load_missing():
    paths = json.load(open(BATCH_FILE, encoding="utf-8"))
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


def write_file(path: str, content: str) -> str:
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def export_batch(paths):
    written = skipped = failed = 0
    failures = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(mcp_read, p): p for p in paths}
        for fut in as_completed(futs):
            path = futs[fut]
            try:
                content = fut.result()
                r = write_file(path, content)
                if r == "written":
                    written += 1
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures[:10]}


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 20
    missing = load_missing()
    batch = missing[:limit]
    if not batch:
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "pending": 0}))
        return
    result = export_batch(batch)
    result["pending"] = len(missing) - result["written"]
    print(json.dumps(result))


if __name__ == "__main__":
    main()
