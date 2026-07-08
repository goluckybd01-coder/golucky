#!/usr/bin/env python3
"""
Write MCP-fetched files to incoming/ as JSON batch.
Reads path->content map from stdin (JSON).
"""
import json, os, sys, glob

INCOMING = "/workspace/.export-tmp/incoming"
os.makedirs(INCOMING, exist_ok=True)

def next_batch():
    nums = []
    for f in glob.glob(os.path.join(INCOMING, "batch_*.json")):
        try:
            nums.append(int(os.path.basename(f).split("_")[1].split(".")[0]))
        except (IndexError, ValueError):
            pass
    n = max(nums, default=0) + 1
    return os.path.join(INCOMING, f"batch_{n:03d}.json")

def main():
    data = json.load(sys.stdin)
    out = next_batch()
    with open(out, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)
    print(json.dumps({"saved": out, "count": len(data), "paths": list(data.keys())}))

if __name__ == "__main__":
    main()
