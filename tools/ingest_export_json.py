#!/usr/bin/env python3
"""Write files from JSON map {rel_path: content} via mcp_immediate_write.py."""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    data = json.load(sys.stdin)
    written, failures = 0, []
    for rel, content in data.items():
        if not content or str(content).startswith("Lovable API error"):
            failures.append({"path": rel, "error": "empty or error content"})
            continue
        proc = subprocess.run(
            [sys.executable, WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if proc.returncode:
            failures.append({"path": rel, "error": (proc.stderr or proc.stdout).strip()})
        else:
            written += 1
            print(proc.stdout.strip())
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
