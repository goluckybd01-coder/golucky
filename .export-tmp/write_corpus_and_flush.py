#!/usr/bin/env python3
"""Save stdin to corpus and write via mcp_immediate_write. Usage: write_corpus_and_flush.py <rel-path>"""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
CORPUS = "/workspace/.export-tmp/corpus"
WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 2:
        print("Usage: write_corpus_and_flush.py <rel-path>", file=sys.stderr)
        sys.exit(1)
    rel = sys.argv[1]
    content = sys.stdin.read()
    if not content:
        print(f"ERROR empty: {rel}", file=sys.stderr)
        sys.exit(1)
    os.makedirs(CORPUS, exist_ok=True)
    stage = os.path.join(CORPUS, rel.replace("/", "__"))
    with open(stage, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        print(r.stderr or r.stdout, file=sys.stderr)
        sys.exit(1)
    print(r.stdout.strip())


if __name__ == "__main__":
    main()
