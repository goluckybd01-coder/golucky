#!/usr/bin/env python3
"""Force-write batch 4 paths from agent-tools MCP outputs."""
import glob
import os
import re
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"

EXPLICIT = {
    "src/pages/games/AviatorGame.tsx": "38cc76f0-0871-4330-8d65-1f512455b74c.txt",
    "src/pages/wallet/WalletCenter.tsx": "a46afb2d-c554-4d36-90fd-4fa02dac3e6c.txt",
}


def basename_stem(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def is_valid_source(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.startswith("{") and ("pagination" in content[:500] or '"data"' in content[:300]):
        return False
    if "Lovable API error" in content[:200]:
        return False
    return True


def match_path(content: str, path: str) -> bool:
    if not is_valid_source(content):
        return False
    stem = basename_stem(path)
    patterns = [
        rf"export\s+default\s+function\s+{re.escape(stem)}\b",
        rf"export\s+function\s+{re.escape(stem)}\b",
        rf"export\s+const\s+{re.escape(stem)}\b",
        rf"export\s+default\s+{re.escape(stem)}\b",
        rf"const\s+{re.escape(stem)}\s*=",
        rf"function\s+{re.escape(stem)}\b",
    ]
    for pat in patterns:
        if re.search(pat, content):
            return True
    if path.endswith("GlobalSettings.tsx") and "GlobalSettingsPage" in content:
        return True
    if path.endswith("AuditLogs.tsx") and "GameAdminAuditLogs" in content:
        return True
    if path.endswith("AgentPayments.tsx") and "AgentPaymentsAdmin" in content:
        return True
    if path.endswith("Statistics.tsx") and re.search(r"export\s+default\s+function\s+Statistics\b", content):
        return True
    return False


def force_write(path: str, content: str) -> None:
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    paths = sys.argv[1:]
    written = []
    failed = []

    for path, fname in EXPLICIT.items():
        if path not in paths:
            continue
        src = os.path.join(TOOLS, fname)
        if not os.path.isfile(src):
            failed.append(path)
            continue
        with open(src, encoding="utf-8", errors="replace") as f:
            force_write(path, f.read().strip())
        written.append(path)

    remaining = [p for p in paths if p not in written]
    seen: set[str] = set()
    tool_files = sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True)

    for tf in tool_files:
        if not remaining:
            break
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or content in seen:
            continue
        seen.add(content)
        hits = [p for p in remaining if match_path(content, p)]
        if len(hits) != 1:
            continue
        path = hits[0]
        force_write(path, content)
        written.append(path)
        remaining.remove(path)

    failed.extend(remaining)
    import json
    print(json.dumps({"written": len(written), "paths_written": written, "failed": failed}))


if __name__ == "__main__":
    main()
