#!/usr/bin/env python3
"""Match agent-tools MCP read_file outputs to explicit paths and write to workspace."""
import glob
import json
import os
import re
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"


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
    # test files
    if path.endswith(".test.tsx") and stem.replace(".test", "") in content:
        if re.search(rf"describe\(['\"]{re.escape(stem.replace('.test', ''))}", content):
            return True
    # SQL migrations
    if path.endswith(".sql"):
        mig = os.path.basename(path).replace(".sql", "")
        if mig in content[:3000]:
            return True
    return False


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


def flush(paths: list[str]) -> dict:
    remaining = {p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))}
    written = skipped = 0
    matched: list[str] = []
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
        status = write_file(path, content)
        remaining.discard(path)
        matched.append(path)
        if status == "written":
            written += 1
        else:
            skipped += 1

    pending = json.load(open("/workspace/.export-tmp/pending_all.json", encoding="utf-8"))
    pending_src = len(
        [p for p in pending.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))]
    )
    return {
        "written": written,
        "skipped": skipped,
        "matched": matched,
        "remaining": sorted(remaining),
        "pending_src": pending_src,
    }


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        data = json.load(open("/workspace/.export-tmp/pending_all.json", encoding="utf-8"))
        paths = [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))]
        print(json.dumps(paths[:n]))
        return
    if sys.argv[1:]:
        paths = sys.argv[1:]
    else:
        paths = json.load(sys.stdin)
    print(json.dumps(flush(paths), indent=2))


if __name__ == "__main__":
    main()
