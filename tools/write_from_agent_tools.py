#!/usr/bin/env python3
"""Copy agent-tools MCP output files to workspace paths."""
import json
import os
import shutil
import sys

WORKSPACE = "/workspace"
AGENT_TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

MAPPINGS = {
    # batch: (agent_tools_file, workspace_rel_path)
}


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def copy_mapping(src_name, rel):
    src = os.path.join(AGENT_TOOLS, src_name)
    if not os.path.isfile(src):
        print(f"MISSING {src_name}", file=sys.stderr)
        return False
    content = open(src, encoding="utf-8").read()
    write_file(rel, content)
    print(f"OK {rel} ({len(content)} bytes)")
    return True


def main():
    pairs = sys.argv[1:]
    if not pairs:
        print("Usage: write_from_agent_tools.py SRC_FILE rel/path ...", file=sys.stderr)
        sys.exit(1)
    if len(pairs) % 2 != 0:
        print("Need pairs of SRC_FILE rel/path", file=sys.stderr)
        sys.exit(1)
    ok = 0
    for i in range(0, len(pairs), 2):
        if copy_mapping(pairs[i], pairs[i + 1]):
            ok += 1
    print(json.dumps({"written": ok}))


if __name__ == "__main__":
    main()
