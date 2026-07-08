#!/usr/bin/env python3
"""Fetch missing manifest paths from Lovable HTTP MCP and write via mcp_immediate_write.py."""
import json
import os
import subprocess
import sys

# Reuse HTTP MCP helpers
sys.path.insert(0, "/workspace/tools")
from mcp_http_export import mcp_read, load_pending_src  # noqa: E402

WORKSPACE = "/workspace"
WRITE = "/workspace/tools/mcp_immediate_write.py"
MANIFEST = "/workspace/.export-tmp/export_manifest.json"
EXTRA = [
    "src/components/ui/toaster.tsx",
    "src/components/ui/sonner.tsx",
    "src/components/ui/tooltip.tsx",
    "src/lib/currency.ts",
]


def write_one(rel: str, content: str) -> tuple[bool, str]:
    proc = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if proc.returncode:
        return False, (proc.stderr or proc.stdout).strip()
    return True, proc.stdout.strip()


def main():
    if os.path.isfile(MANIFEST):
        paths = json.load(open(MANIFEST, encoding="utf-8")).get("paths", [])
    else:
        paths = load_pending_src()[:40]

    # Add extras if missing
    for p in EXTRA:
        if p not in paths and not os.path.isfile(os.path.join(WORKSPACE, p)):
            paths.append(p)

    paths = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]

    written, skipped, failures = 0, 0, []
    for rel in paths:
        try:
            content = mcp_read(rel)
            ok, msg = write_one(rel, content)
            if ok:
                written += 1
                print(msg)
            else:
                failures.append({"path": rel, "error": msg})
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
            print(f"FAIL {rel}: {e}", file=sys.stderr)

    first40_missing = len([p for p in load_pending_src()[:40] if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({
        "written": written,
        "skipped": skipped,
        "failed": len(failures),
        "failures": failures,
        "first40_still_missing": first40_missing,
        "first40_complete": first40_missing == 0,
    }))


if __name__ == "__main__":
    main()
