#!/usr/bin/env python3
"""Write files from JSONL: each line {"path": "...", "content": "..."}"""
import json
import subprocess
import sys

WRITE = "/workspace/tools/mcp_immediate_write.py"


def main():
    if len(sys.argv) != 2:
        print("Usage: mcp_batch_write_jsonl.py <file.jsonl>", file=sys.stderr)
        sys.exit(1)
    written, failures = 0, []
    with open(sys.argv[1], encoding="utf-8") as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                rec = json.loads(line)
                path = rec["path"]
                content = rec["content"]
            except (json.JSONDecodeError, KeyError) as e:
                failures.append({"line": lineno, "error": str(e)})
                continue
            proc = subprocess.run(
                [sys.executable, WRITE, path],
                input=content,
                text=True,
                capture_output=True,
            )
            if proc.returncode != 0:
                failures.append({
                    "path": path,
                    "error": (proc.stderr or proc.stdout).strip(),
                })
            else:
                written += 1
                print(proc.stdout.strip())
    print(json.dumps({"written": written, "failed": len(failures), "failures": failures}))


if __name__ == "__main__":
    main()
