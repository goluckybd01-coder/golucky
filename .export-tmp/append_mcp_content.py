#!/usr/bin/env python3
"""Append path+content to incoming JSON chunk and optionally flush."""
import json
import os
import sys

WORKSPACE = "/workspace"
INCOMING = "/workspace/.export-tmp/incoming"
CHUNK = os.path.join(INCOMING, "live_chunk.json")


def write_file(path: str, content: str) -> str:
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def main():
    if len(sys.argv) < 3:
        print("Usage: append_mcp_content.py write <path>  (stdin=content)", file=sys.stderr)
        print("       append_mcp_content.py flush-chunk", file=sys.stderr)
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "write":
        path = sys.argv[2]
        content = sys.stdin.read()
        r = write_file(path, content)
        print(json.dumps({"path": path, "result": r}))
        return
    if cmd == "flush-chunk":
        if not os.path.isfile(CHUNK):
            print(json.dumps({"written": 0, "skipped": 0}))
            return
        data = json.load(open(CHUNK, encoding="utf-8"))
        written = skipped = 0
        for path, content in data.items():
            r = write_file(path, content)
            if r == "skipped":
                skipped += 1
            else:
                written += 1
        batch = json.load(open("/workspace/.export-tmp/batch_1.json"))
        on_disk = sum(1 for p in batch if os.path.isfile(os.path.join(WORKSPACE, p)))
        print(json.dumps({"written": written, "skipped": skipped, "total": len(batch), "on_disk": on_disk, "pending": len(batch) - on_disk}))
        return
    print("Unknown command", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
