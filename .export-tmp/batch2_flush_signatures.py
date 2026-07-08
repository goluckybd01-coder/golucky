#!/usr/bin/env python3
"""Write batch2 admin pages from agent-tools by signature matching."""
import glob
import json
import os

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
SIG_FILE = "/workspace/.export-tmp/batch2_signatures.json"


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def main():
    sigs = json.load(open(SIG_FILE, encoding="utf-8"))
    pending = dict(sigs)
    written = []
    seen = set()

    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or len(content) < 100:
            continue
        if content.startswith("{") and '"pagination"' in content[:500]:
            continue
        if content.startswith("Lovable API error"):
            continue
        key = content[:120] + str(len(content))
        if key in seen:
            continue

        matched = [p for p, sig in pending.items() if sig in content]
        if len(matched) == 1:
            path = matched[0]
            write_file(path, content)
            written.append(path)
            del pending[path]
            seen.add(key)

    print(json.dumps({"written": len(written), "paths_written": written, "pending": list(pending.keys())}))


if __name__ == "__main__":
    main()
