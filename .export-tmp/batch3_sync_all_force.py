#!/usr/bin/env python3
"""Read all batch_3 paths via Lovable MCP broker and write to /workspace (overwrite)."""
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch3_paths.json"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")
CONCURRENCY = int(os.environ.get("BATCH3_CONCURRENCY", "6"))


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


def write_file(path: str, content: str) -> None:
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def sync_one(path: str) -> tuple[str, str | None]:
    try:
        content = mcp_read(path)
        write_file(path, content)
        return path, None
    except Exception as e:
        return path, str(e)


def main():
    paths = json.load(open(BATCH_FILE, encoding="utf-8"))
    written: list[str] = []
    failed: list[dict] = []

    with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(sync_one, p): p for p in paths}
        for fut in as_completed(futs):
            path, err = fut.result()
            if err:
                failed.append({"path": path, "error": err})
            else:
                written.append(path)

    written.sort()
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))


if __name__ == "__main__":
    main()
