#!/usr/bin/env python3
"""Write remaining batch3 files using batch3_force_write helper."""
import subprocess
import sys

FILES = [
    "src/pages/games/MinesGame.tsx",
    "src/pages/admin/PayoutAuditLogs.tsx",
    "src/pages/admin/UserHistory.tsx",
]

def main():
    if len(sys.argv) < 2:
        print("usage: write_remaining_batch3.py <content-file> [content-file...]")
        sys.exit(1)
    content_files = sys.argv[1:]
    if len(content_files) != len(FILES):
        print(f"expected {len(FILES)} content files, got {len(content_files)}")
        sys.exit(1)
    for rel, src in zip(FILES, content_files):
        r = subprocess.run(
            ["python3", "/workspace/.export-tmp/batch3_mcp_write_one.py", rel, src],
            capture_output=True, text=True
        )
        print(r.stdout.strip() or r.stderr.strip())
        if r.returncode != 0:
            sys.exit(r.returncode)

if __name__ == "__main__":
    main()
