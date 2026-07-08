#!/usr/bin/env python3
"""Write all staged batch121 files via mcp_immediate_write."""
import json
import os
import subprocess

WRITE = "/workspace/tools/mcp_immediate_write.py"
STAGING = "/workspace/.export-tmp/staging"

# rel_path -> staging filename
MANIFEST = {
    "src/pages/games/__tests__/VideoWinGo.placeBetError.test.tsx": "src__pages__games____tests____VideoWinGo.placeBetError.test.tsx",
    "src/test/lucky-hub-lock-v3.test.tsx": "src__test__lucky-hub-lock-v3.test.tsx",
    "src/test/deposit-centre-lock-v1.test.tsx": "src__test__deposit-centre-lock-v1.test.tsx",
}

def flush(manifest):
    written = failed = 0
    failures = []
    for rel, fname in manifest.items():
        staging = os.path.join(STAGING, fname)
        if not os.path.isfile(staging):
            failures.append({"path": rel, "error": "staging missing"})
            failed += 1
            continue
        content = open(staging, encoding="utf-8").read()
        r = subprocess.run(
            ["python3", WRITE, rel],
            input=content,
            text=True,
            capture_output=True,
        )
        if r.returncode == 0:
            written += 1
            print(r.stdout.strip())
        else:
            failed += 1
            failures.append({"path": rel, "error": (r.stderr or r.stdout).strip()})
    return written, failed, failures

if __name__ == "__main__":
    w, f, fails = flush(MANIFEST)
    print(json.dumps({"written": w, "failed": f, "failures": fails}))
