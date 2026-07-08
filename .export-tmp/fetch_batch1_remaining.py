#!/usr/bin/env python3
"""Fetch batch1 missing pages via Lovable MCP HTTP and write to /workspace."""
import json
import os
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
MCP_URL = os.environ.get("LOVABLE_MCP_URL", "https://mcp.lovable.dev/mcp")

PATHS = [
    "src/pages/admin/PremiumDepositsPage.tsx",
    "src/pages/admin/PremiumWithdrawsPage.tsx",
    "src/pages/admin/BannersAdmin.tsx",
    "src/pages/admin/AnnouncementsAdmin.tsx",
    "src/pages/admin/SupportChatAdmin.tsx",
    "src/pages/admin/AgentCommissionAdmin.tsx",
    "src/pages/admin/DatabaseAdmin.tsx",
    "src/pages/admin/KycAdmin.tsx",
    "src/pages/admin/AdminCmsFoundationPage.tsx",
]


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


def main():
    written = []
    failed = []
    with ThreadPoolExecutor(max_workers=4) as ex:
        futs = {ex.submit(mcp_read, p): p for p in PATHS}
        for fut in as_completed(futs):
            path = futs[fut]
            try:
                content = fut.result()
                write_file(path, content)
                written.append(path)
                print(f"OK {path} ({len(content)} bytes)", file=sys.stderr)
            except Exception as e:
                failed.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", file=sys.stderr)
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))


if __name__ == "__main__":
    main()
