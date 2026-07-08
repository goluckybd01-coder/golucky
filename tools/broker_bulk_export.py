#!/usr/bin/env python3
"""Bulk export pending paths via Lovable MCP using Cursor agent broker token."""
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
PENDING = "/workspace/.export-tmp/pending_all.json"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
CONCURRENCY = int(os.environ.get("EXPORT_CONCURRENCY", "8"))


def pending_paths(include_critical=False):
    data = json.load(open(PENDING, encoding="utf-8"))
    paths = list(data.get("pending_src_paths", []))
    if include_critical:
        for p in data.get("pending") or []:
            if p.startswith("supabase/migrations/") and p.endswith(".sql"):
                paths.append(p)
            elif p.startswith("scripts/"):
                paths.append(p)
            elif p in (
                "src/context/WalletContext.tsx",
                "src/lib/featureFlags.ts",
                "src/lib/supabaseClient.ts",
            ):
                paths.append(p)
    seen = set()
    out = []
    for p in paths:
        if p in seen:
            continue
        seen.add(p)
        if not os.path.isfile(os.path.join(WORKSPACE, p)):
            out.append(p)
    return out


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
                if "error" in data:
                    raise RuntimeError(str(data["error"]))
            except json.JSONDecodeError:
                pass
    try:
        data = json.loads(raw)
        if "error" in data:
            raise RuntimeError(str(data["error"]))
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
            "arguments": {"project_id": PROJECT_ID, "path": path},
        },
    }).encode()
    req = urllib.request.Request(MCP_URL, data=body, headers=mcp_headers(), method="POST")
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read().decode()
    text = parse_mcp_text(raw)
    if not text or text.startswith("Lovable API error"):
        raise RuntimeError(text or "empty")
    if text.lstrip().startswith("@import") or text.lstrip().startswith("@tailwind"):
        raise RuntimeError("corrupted CSS content")
    return text


def write_file(path: str, content: str, overwrite=False) -> str:
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full) and not overwrite:
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def export_batch(paths, overwrite=False):
    written = skipped = failed = 0
    failures = []
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(mcp_read, p): p for p in paths}
        for fut in as_completed(futs):
            path = futs[fut]
            try:
                content = fut.result()
                r = write_file(path, content, overwrite=overwrite)
                if r == "written":
                    written += 1
                    print(f"OK {path}")
                else:
                    skipped += 1
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}")
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


def main():
    include_critical = "--critical" in sys.argv
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    limit = int(args[0]) if args else 25
    pending = pending_paths(include_critical=include_critical)
    batch = pending[:limit]
    print(json.dumps({"batch_size": len(batch), "pending_src": len(pending)}))
    if not batch:
        return
    result = export_batch(batch)
    remaining = len(pending_paths(include_critical=include_critical))
    result["pending_src_remaining"] = remaining
    print(json.dumps(result))


if __name__ == "__main__":
    main()
