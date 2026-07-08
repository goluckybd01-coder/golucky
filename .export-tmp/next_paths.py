#!/usr/bin/env python3
"""Automated export loop helper - outputs next N pending paths as JSON array."""
import json, os, subprocess, sys

def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    prefix = sys.argv[2] if len(sys.argv) > 2 else "src/"
    r = subprocess.run(
        ["python3", "/workspace/.export-tmp/export_queue.py", "next", str(n), prefix],
        capture_output=True, text=True,
    )
    paths = json.loads(r.stdout)
    print(json.dumps(paths))

if __name__ == "__main__":
    main()
