#!/usr/bin/env python3
"""Write batch_3 incoming JSON to /workspace, skipping existing files."""
import json, os, sys

WORKSPACE = "/workspace"

def write_map(data):
    written = skipped = failed = 0
    failures = []
    for path, content in data.items():
        if content is None:
            failed += 1
            failures.append(path)
            continue
        full = os.path.join(WORKSPACE, path)
        if os.path.isfile(full):
            skipped += 1
            continue
        os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
        try:
            with open(full, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if content and not content.endswith("\n"):
                    f.write("\n")
            written += 1
        except Exception as e:
            failed += 1
            failures.append({"path": path, "error": str(e)})
    return written, skipped, failed, failures

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/incoming/batch_3.json"
    data = json.load(open(src, encoding="utf-8"))
    w, s, f, failures = write_map(data)
    print(json.dumps({"written": w, "skipped": s, "failed": f, "failures": failures[:5]}))
