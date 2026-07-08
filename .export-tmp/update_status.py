#!/usr/bin/env python3
"""Update EXPORT_STATUS.json with current export metrics."""
import json, os, datetime, glob

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
PAGES_DIR = "/workspace/.export-tmp/pages"
STATUS = "/workspace/.export-tmp/EXPORT_STATUS.json"

with open(MANIFEST) as f:
    m = json.load(f)
src = m.get("src_text_files", [])
pending = [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]
exported = len(src) - len(pending)
pages = sorted(glob.glob(os.path.join(PAGES_DIR, "page_*.json")))
pagination_complete = False
if pages:
    last = json.load(open(pages[-1]))
    pagination_complete = not last.get("pagination", {}).get("has_more", True)

status = {
    "updated_at": datetime.datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
    "pagination_pages": len(pages),
    "pagination_complete": pagination_complete,
    "total_listed": m.get("total_listed", 0),
    "text_files_listed": m.get("text_files", []).__len__() if isinstance(m.get("text_files"), list) else len(m.get("text_files", [])),
    "src_text_listed": len(src),
    "exported_src": exported,
    "pending_src": len(pending),
    "src_files_on_disk": len(glob.glob(os.path.join(WORKSPACE, "src/**/*"), recursive=True)),
    "failures": [],
}
with open(STATUS, "w") as f:
    json.dump(status, f, indent=2)
print(json.dumps(status))
