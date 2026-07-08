#!/usr/bin/env python3
"""Stage path->content JSON (stdin or file) into reads/*.content for flush-reads."""
import json
import os
import sys

READS = "/workspace/.export-tmp/reads"


def stage_path(rel: str, content: str) -> str:
    name = rel.replace("/", "__") + ".content"
    path = os.path.join(READS, name)
    os.makedirs(READS, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return path


def main():
    if len(sys.argv) > 1:
        data = json.load(open(sys.argv[1], encoding="utf-8"))
    else:
        data = json.load(sys.stdin)
    staged = []
    for rel, content in data.items():
        if content is None:
            continue
        staged.append(stage_path(rel, content))
    print(json.dumps({"staged": len(staged), "files": staged[:5]}))


if __name__ == "__main__":
    main()
