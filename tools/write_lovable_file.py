#!/usr/bin/env python3
"""Write file content from Lovable export. Usage: write_lovable_file.py <rel-path> <content-file>"""
import pathlib
import sys

if len(sys.argv) != 3:
    print("Usage: write_lovable_file.py <rel-path> <content-file>", file=sys.stderr)
    sys.exit(1)

rel = sys.argv[1]
src = pathlib.Path(sys.argv[2])
dst = pathlib.Path("/workspace") / rel
dst.parent.mkdir(parents=True, exist_ok=True)
content = src.read_text(encoding="utf-8")
dst.write_text(content if content.endswith("\n") else content + "\n", encoding="utf-8", newline="\n")
print(f"Wrote {dst} ({len(content)} bytes)")
