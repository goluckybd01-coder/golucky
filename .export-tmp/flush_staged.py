#!/usr/bin/env python3
"""Export files from Lovable via batch JSON files produced by agent MCP reads.
Usage: python3 flush_staged.py  # writes all staged reads to workspace via write_batch.py
"""
import json, os, glob, subprocess

READS_DIR = "/workspace/.export-tmp/staged_batches"
os.makedirs(READS_DIR, exist_ok=True)

def flush():
    batches = sorted(glob.glob(os.path.join(READS_DIR, "batch_*.json")))
    total = 0
    for b in batches:
        r = subprocess.run(
            ["python3", "/workspace/.export-tmp/write_batch.py", b],
            capture_output=True, text=True
        )
        if r.returncode == 0:
            result = json.loads(r.stdout)
            total += result.get("exported", 0)
            print(f"{os.path.basename(b)}: {result}")
        else:
            print(f"FAIL {b}: {r.stderr}")
    print(json.dumps({"total_exported": total}))

if __name__ == "__main__":
    flush()
