#!/usr/bin/env python3
"""Apply all staged missing Lovable exports via bridge_write/mcp_immediate_write."""
import json
import subprocess
import sys
from pathlib import Path

MANIFEST = Path("/workspace/.export-tmp/batch_missing_paths.json")
STAGING = Path("/workspace/.export-tmp/batch_missing_staging")
BRIDGE = Path("/workspace/tools/bridge_write.py")
WORKSPACE = Path("/workspace")
SKIP = {"src/hooks/useAuth.ts"}


def enc(rel: str) -> str:
    return rel.replace("/", "__")


def main() -> int:
    paths = json.loads(MANIFEST.read_text(encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel in paths:
        if rel in SKIP:
            print(f"SKIP not in Lovable: {rel}")
            skipped += 1
            continue
        dest = WORKSPACE / rel
        if dest.is_file() and dest.stat().st_size > 0:
            print(f"SKIP existing {rel}")
            skipped += 1
            continue
        stage = STAGING / enc(rel)
        if not stage.is_file():
            failures.append({"path": rel, "error": "not staged"})
            failed += 1
            continue
        content = stage.read_text(encoding="utf-8")
        r = subprocess.run(
            [sys.executable, str(BRIDGE), rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode != 0:
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
            failed += 1
            continue
        written += 1
        print((r.stdout or "").strip())
    summary = {"written": written, "skipped": skipped, "failed": failed, "failures": failures}
    print(json.dumps(summary, indent=2))
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
