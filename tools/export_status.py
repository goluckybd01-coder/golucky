#!/usr/bin/env python3
"""Report export status for first-40 list."""
import json
import os
import sys

WORKSPACE = "/workspace"
LIST = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/first40_remaining.json"
paths = json.load(open(LIST, encoding="utf-8"))
missing = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
written = [p for p in paths if os.path.isfile(os.path.join(WORKSPACE, p))]
print(json.dumps({
    "total": len(paths),
    "written": len(written),
    "missing": len(missing),
    "missing_paths": missing,
    "written_paths": written,
}, indent=2))
