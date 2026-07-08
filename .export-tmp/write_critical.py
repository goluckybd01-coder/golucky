#!/usr/bin/env python3
"""Write critical build files from MCP-fetched content files in /tmp/mcp_critical/."""
import os, sys, glob
WORKSPACE = "/workspace"
SRC = "/tmp/mcp_critical"
ok = 0
for f in sorted(glob.glob(os.path.join(SRC, "*"))):
    name = os.path.basename(f)
  # name format: path__with__slashes.ext -> path/with/slashes.ext
    rel = name.replace("__", "/")
    with open(f, encoding="utf-8") as inf:
        content = inf.read()
    full = os.path.join(WORKSPACE, rel)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as out:
        out.write(content)
        if content and not content.endswith("\n"):
            out.write("\n")
    ok += 1
    print(f"Wrote {rel}")
print(f"Total: {ok}")
