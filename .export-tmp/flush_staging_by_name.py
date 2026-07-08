#!/usr/bin/env python3
"""Map staging basename -> batch_2 path and write to workspace."""
import json
import os
import sys

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"


def load_batch():
    return json.load(open(BATCH_FILE, encoding="utf-8"))


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
    batch = load_batch()
    pending = {p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))}
    by_base = {}
    for p in batch:
        by_base.setdefault(os.path.basename(p), []).append(p)

    written = skipped = failed = 0
    matched = []
    if not os.path.isdir(STAGING):
        print(json.dumps({"written": 0, "skipped": 0, "failed": 0, "matched": []}))
        return

    for name in sorted(os.listdir(STAGING)):
        src = os.path.join(STAGING, name)
        if not os.path.isfile(src):
            continue
        hits = by_base.get(name, [])
        path = None
        if len(hits) == 1:
            path = hits[0]
        elif len(hits) > 1:
            for h in hits:
                if h in pending:
                    path = h
                    break
        if not path or path not in pending:
            continue
        with open(src, encoding="utf-8") as f:
            content = f.read()
        status = write_file(path, content)
        if status == "written":
            written += 1
        else:
            skipped += 1
        matched.append({"path": path, "status": status})
        pending.discard(path)

    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "matched": matched, "pending": len(pending)}))


if __name__ == "__main__":
    main()
