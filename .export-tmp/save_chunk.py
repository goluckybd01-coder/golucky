#!/usr/bin/env python3
"""
Export batch_1.json via Lovable read_file responses saved as JSON chunks.
Usage: save_chunk.py <chunk.json>  (dict of path -> content)
Then: python3 bulk_write.py <chunk.json>
"""
import json, os, sys
WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_1.json"

def main():
    chunk_path = sys.argv[1]
    data = json.load(open(chunk_path, encoding="utf-8"))
    batch = set(json.load(open(BATCH)))
    written = skipped = failed = 0
    for path, content in data.items():
        if path not in batch:
            failed += 1
            continue
        full = os.path.join(WORKSPACE, path)
        if os.path.exists(full):
            skipped += 1
            continue
        if not content or str(content).startswith("Lovable API error"):
            failed += 1
            continue
        os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
        with open(full, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        written += 1
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed}))

if __name__ == "__main__":
    main()
