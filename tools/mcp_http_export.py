#!/usr/bin/env python3
"""Export pending files from Lovable via HTTP MCP (Cursor broker token)."""
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
REF = os.environ.get("LOVABLE_REF", "9cc0a40bac6c3843550ef2d7e7c27d0bfca3d67c")
WORKSPACE = "/workspace"
PENDING_FILE = "/workspace/.export-tmp/pending_all.json"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
CONCURRENCY = int(os.environ.get("EXPORT_CONCURRENCY", "8"))
BATCH_SIZE = int(os.environ.get("EXPORT_BATCH_SIZE", "25"))


def load_pending_src():
    data = json.load(open(PENDING_FILE, encoding="utf-8"))
    paths = data.get("pending_src_paths") or []
    return [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]


def load_pending_critical():
    data = json.load(open(PENDING_FILE, encoding="utf-8"))
    pending = data.get("pending") or []
    critical = []
    for p in pending:
        if p.startswith("supabase/migrations/") and p.endswith(".sql"):
            critical.append(p)
        elif p.startswith("scripts/"):
            critical.append(p)
        elif p in (
            "src/context/WalletContext.tsx",
            "src/lib/featureFlags.ts",
            "src/lib/supabaseClient.ts",
        ):
            critical.append(p)
    return [p for p in critical if not os.path.isfile(os.path.join(WORKSPACE, p))]


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
                    print(f"OK {path}", flush=True)
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "src"
    if cmd == "status":
        src = load_pending_src()
        crit = load_pending_critical()
        print(json.dumps({"pending_src": len(src), "pending_critical": len(crit), "first_10_src": src[:10]}))
        return

    if cmd == "critical":
        paths = load_pending_critical()
    else:
        paths = load_pending_src()

    limit = int(sys.argv[2]) if len(sys.argv) > 2 else BATCH_SIZE
    batch = paths[:limit]
    if not batch:
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "pending_src": len(load_pending_src())}))
        return

    result = export_batch(batch)
    result["pending_src"] = len(load_pending_src())
    result["pending_critical"] = len(load_pending_critical())
    print(json.dumps(result))


if __name__ == "__main__":
    main()
