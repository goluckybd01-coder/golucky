#!/usr/bin/env python3
"""Get next cursor for pagination from last saved page."""
import json, glob, os, sys

pages_dir = "/workspace/.export-tmp/pages"
pages = sorted(glob.glob(f"{pages_dir}/page_*.json"))
if not pages:
    print(json.dumps({"next_page": 1, "cursor": None}))
    sys.exit(0)

last = pages[-1]
num = int(os.path.basename(last).replace("page_", "").replace(".json", ""))
with open(last) as f:
    data = json.load(f)
pag = data.get("pagination", {})
if not pag.get("has_more"):
    print(json.dumps({"done": True, "pages": len(pages), "last_page": num}))
else:
    print(json.dumps({"next_page": num + 1, "cursor": pag.get("next_cursor"), "last_page": num, "has_more": True}))
