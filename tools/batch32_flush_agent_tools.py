#!/usr/bin/env python3
"""Extract Lovable read_file results from agent-tools and write batch32 via mcp_immediate_write."""
import glob
import json
import os
import re
import subprocess
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
STAGE_WRITE = os.path.join(WORKSPACE, "tools/batch32_stage_and_write.py")
PATHS_FILE = os.path.join(WORKSPACE, ".export-tmp/batch32_paths.json")


def basename_stem(path: str) -> str:
    return os.path.splitext(os.path.basename(path))[0]


def is_valid_source(content: str) -> bool:
    if not content or len(content) < 80:
        return False
    if content.startswith("{") and ("pagination" in content[:500] or '"data"' in content[:300]):
        return False
    if "Lovable API error" in content[:200]:
        return False
    head = content.lstrip()[:30]
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
  # UI components
    if stem in ("toaster", "sonner", "tooltip"):
        if stem == "toaster" and "Toaster" in content and "useToast" in content:
            return path.endswith("toaster.tsx")
        if stem == "sonner" and "Sonner" in content and "sonner" in content:
            return path.endswith("sonner.tsx")
        if stem == "tooltip" and "TooltipProvider" in content:
            return path.endswith("tooltip.tsx")
    return False


def write_one(rel: str, content: str) -> tuple[bool, str]:
    r = subprocess.run(
        [sys.executable, STAGE_WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        return False, (r.stderr or r.stdout).strip()
    return True, r.stdout.strip()


def main():
    paths = json.load(open(PATHS_FILE, encoding="utf-8"))
    remaining = set(paths)
    written = failed = 0
    matched = []
    failures = []
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
        ok, msg = write_one(path, content)
        if ok:
            remaining.discard(path)
            matched.append(path)
            written += 1
            print(msg)
        else:
            failed += 1
            failures.append({"path": path, "error": msg})

    print(json.dumps({
        "written": written,
        "failed": failed,
        "failures": failures,
        "matched": matched,
        "remaining": sorted(remaining),
    }, indent=2))
    return 0 if not remaining else 1


if __name__ == "__main__":
    sys.exit(main())
