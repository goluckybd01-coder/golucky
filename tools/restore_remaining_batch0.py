#!/usr/bin/env python3
"""Restore specific paths from Lovable MCP via mcp_immediate_write.py."""
import importlib.util
import json
import os
import sys

spec = importlib.util.spec_from_file_location(
    "restore_wingo_batch0",
    "/workspace/tools/restore_wingo_batch0.py",
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

REMAINING = [
    "src/components/WinAmountDisplay.tsx",
    "src/components/MainLayout.tsx",
    "src/lib/gameEngineBase.ts",
    "src/lib/gameStorage.ts",
    "src/lib/gameHistoryService.ts",
]


def main():
    fixed = 0
    failures = []
    for rel in REMAINING:
        try:
            content = mod.mcp_read(rel)
            mod.write_file(rel, content)
            if mod.verify(rel):
                fixed += 1
                print(f"OK {rel} ({len(content)} bytes)")
            else:
                failures.append({"path": rel, "error": "still contains PageScaffold import"})
        except Exception as e:
            failures.append({"path": rel, "error": str(e)})
            print(f"FAIL {rel}: {e}", file=sys.stderr)
    print(json.dumps({"fixed": fixed, "total": len(REMAINING), "failures": failures}, indent=2))
    return 0 if fixed == len(REMAINING) else 1


if __name__ == "__main__":
    sys.exit(main())
