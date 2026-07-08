#!/usr/bin/env python3
"""Write MCP-fetched content from reads/*.content staging to workspace."""
import subprocess
import sys

if __name__ == "__main__":
    r = subprocess.run(
        [sys.executable, "/workspace/.export-tmp/batch2_write_all_remaining.py"],
        capture_output=True,
        text=True,
    )
    print(r.stdout.strip())
    if r.returncode:
        print(r.stderr, file=sys.stderr)
        sys.exit(r.returncode)
