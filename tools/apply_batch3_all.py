#!/usr/bin/env python3
import json, os, re, subprocess, sys

WRITE = "/workspace/tools/mcp_immediate_write.py"
SNAP = "/workspace/.export-tmp/batch3_snap"
ALL = json.load(open("/workspace/.export-tmp/fix_batch3_paths.json"))

GARBAGE = 'import PageScaffold from "@/components/templates/PageScaffold"'
SELF_IMPORT = re.compile(r'^import\s+\w+\s+from\s+["\']@/(?:components|pages)(?:/[^"\']+)?/(\w+)["\']', re.M)

def corrupted(rel, content):
    if GARBAGE in content: return True
    stem = os.path.splitext(os.path.basename(rel))[0]
    return any(m.group(1) == stem for m in SELF_IMPORT.finditer(content))

fixed = 0
for rel in ALL:
    full = os.path.join("/workspace", rel)
    if os.path.isfile(full):
        with open(full, encoding="utf-8") as f:
            if not corrupted(rel, f.read()):
                continue
    snap = os.path.join(SNAP, rel.replace("/", "__"))
    if not os.path.isfile(snap):
        print(f"MISSING {rel}", file=sys.stderr)
        continue
    with open(snap, encoding="utf-8") as f:
        content = f.read()
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode != 0:
        print(f"FAIL {rel}: {r.stderr or r.stdout}", file=sys.stderr)
        continue
    with open(full, encoding="utf-8") as f:
        if corrupted(rel, f.read()):
            print(f"STILL_CORRUPT {rel}", file=sys.stderr)
            continue
    fixed += 1
    print(r.stdout.strip())

remaining = [rel for rel in ALL if not os.path.isfile(os.path.join(SNAP, rel.replace("/", "__")))]
print(json.dumps({"fixed_this_run": fixed, "missing_snaps": remaining}))
