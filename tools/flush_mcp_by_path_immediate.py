#!/usr/bin/env python3
"""Match agent-tools MCP outputs to paths and write via mcp_immediate_write.py"""
import glob
import json
import os
import re
import subprocess
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def basename_stem(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def is_valid_source(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.startswith("{") and ("pagination" in content[:500] or '"data"' in content[:300]):
        return False
    if "Lovable API error" in content[:200]:
        return False
    head = content.lstrip()[:20]
    if head.startswith("@import") or head.startswith("@tailwind"):
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
    if path.endswith(".test.tsx") and stem.replace(".test", "") in content:
        if re.search(rf"describe\(['\"]{re.escape(stem.replace('.test', ''))}", content):
            return True
    return False


def write_via_tool(path: str, content: str) -> str:
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    r = subprocess.run(
        [sys.executable, WRITE, path],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        raise RuntimeError((r.stderr or r.stdout).strip())
    return "written"


def flush(paths: list[str]) -> dict:
    remaining = {p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))}
    written = skipped = failed = 0
    matched: list[str] = []
    failures: list[dict] = []
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
        hits = [p for p in list(remaining) if match_path(content, p)]
        if len(hits) != 1:
            continue
        path = hits[0]
        try:
            status = write_via_tool(path, content)
            remaining.discard(path)
            matched.append(path)
            if status == "written":
                written += 1
                print(f"Wrote {path} ({len(content)} bytes)")
            else:
                skipped += 1
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})

    return {
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "failures": failures,
        "matched": matched,
        "remaining": sorted(remaining),
    }


def main():
    if sys.argv[1:]:
        paths = sys.argv[1:]
    else:
        paths = json.load(sys.stdin)
    print(json.dumps(flush(paths), indent=2))


if __name__ == "__main__":
    main()
