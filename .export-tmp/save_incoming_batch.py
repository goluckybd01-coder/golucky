#!/usr/bin/env python3
"""Save MCP read results to incoming batch JSON for export_state flush."""
import json, os, sys, time, glob

INCOMING = "/workspace/.export-tmp/incoming"
os.makedirs(INCOMING, exist_ok=True)

def next_batch_path():
    existing = glob.glob(os.path.join(INCOMING, "batch_*.json"))
    nums = []
    for f in existing:
        base = os.path.basename(f)
        try:
            nums.append(int(base.split("_")[1].split(".")[0]))
        except (IndexError, ValueError):
            pass
    n = max(nums, default=0) + 1
    return os.path.join(INCOMING, f"batch_{n:03d}.json")

def main():
    text = sys.stdin.read()
    data = {}
    parts = text.split("===PATH===")
    for part in parts[1:]:
        if "===END===" not in part:
            continue
        header, content = part.split("===END===", 1)
        path = header.strip()
        content = content.lstrip("\n")
        if path and content and not content.startswith("Lovable API error"):
            data[path] = content
    if not data:
        print(json.dumps({"error": "no files parsed", "bytes": len(text)}))
        sys.exit(1)
    out = next_batch_path()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(json.dumps({"saved": out, "count": len(data), "paths": list(data.keys())}))

if __name__ == "__main__":
    main()
