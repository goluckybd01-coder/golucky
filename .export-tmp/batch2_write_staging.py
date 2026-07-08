#!/usr/bin/env python3
"""Write batch_2 paths from staging/ or mcp_responses/ to workspace (skip existing)."""
import glob
import json
import os

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"
STAGING = "/workspace/.export-tmp/staging"
MCP_RESP = "/workspace/.export-tmp/mcp_responses"


def safe_name(path):
    return path.replace("/", "__")


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    batch = json.load(open(BATCH_FILE, encoding="utf-8"))
    pending = [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]
    written = skipped = failed = 0
    matched = []

    for path in pending:
        candidates = [
            os.path.join(STAGING, path),
            os.path.join(STAGING, safe_name(path)),
            os.path.join(STAGING, os.path.basename(path)),
            os.path.join(MCP_RESP, safe_name(path)),
            os.path.join(MCP_RESP, os.path.basename(path)),
        ]
        content = None
        src_used = None
        for src in candidates:
            if os.path.isfile(src):
                with open(src, encoding="utf-8") as f:
                    content = f.read()
                src_used = src
                break
        if not content or content.startswith("Lovable API error"):
            failed += 1
            continue
        status = write_file(path, content)
        if status == "written":
            written += 1
            if src_used and src_used.startswith(MCP_RESP):
                os.remove(src_used)
        else:
            skipped += 1
        matched.append({"path": path, "status": status})

    total = len(batch)
    exported = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": failed,
        "matched": matched,
        "total": total,
        "exported": exported,
        "pending": total - exported,
    }))


if __name__ == "__main__":
    main()
