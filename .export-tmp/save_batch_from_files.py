#!/usr/bin/env python3
"""Build batch JSON from path->content dict and run write_batch.py."""
import json, subprocess, sys

def main():
    batch_path = sys.argv[1]
    with open(batch_path) as f:
        items = json.load(f)
    r = subprocess.run(
        ["python3", "/workspace/.export-tmp/write_batch.py", batch_path],
        capture_output=True, text=True,
    )
    print(r.stdout or r.stderr)
    sys.exit(r.returncode)

if __name__ == "__main__":
    main()
