#!/usr/bin/env python3
"""Flush staged .content files for batch2 remaining admin pages."""
import glob
import json
import os
import subprocess

WORKSPACE = "/workspace"
READS = "/workspace/.export-tmp/reads"
EXPECTED = [
    "src/pages/admin/AdminApiGameControlsPage.tsx",
    "src/pages/admin/AdminUniversalCmsPage.tsx",
    "src/pages/admin/SuperAdminControlPage.tsx",
    "src/pages/admin/AdminLoginPage.tsx",
    "src/pages/admin/SuperAdminPage.tsx",
    "src/pages/admin/SecurityCenter.tsx",
    "src/pages/admin/PromotionCenter.tsx",
]

def rel_to_stem(rel: str) -> str:
    return rel.replace("/", "__")

def main():
    written = []
    failed = []
    for rel in EXPECTED:
        stem = rel_to_stem(rel)
        cf = os.path.join(READS, f"{stem}.content")
        if not os.path.isfile(cf):
            failed.append({"path": rel, "error": "staging file missing"})
            continue
        content = open(cf, encoding="utf-8").read()
        if not content.strip():
            failed.append({"path": rel, "error": "empty"})
            continue
        try:
            subprocess.run(
                ["python3", "/workspace/.export-tmp/batch2_write_stdin.py", rel],
                input=content,
                capture_output=True,
                text=True,
                check=True,
            )
            written.append(rel)
        except subprocess.CalledProcessError as e:
            failed.append({"path": rel, "error": e.stderr or str(e)})
    print(json.dumps({"written": len(written), "failed": failed, "paths_written": written}))

if __name__ == "__main__":
    main()
