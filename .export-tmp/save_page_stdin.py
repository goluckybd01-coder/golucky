#!/usr/bin/env python3
"""Save page from stdin JSON. Usage: cat page.json | python3 save_page_stdin.py 6"""
import json, sys, os
PAGES_DIR = "/workspace/.export-tmp/pages"
os.makedirs(PAGES_DIR, exist_ok=True)
page_num = int(sys.argv[1])
data = json.load(sys.stdin)
out = {"data": data["data"], "pagination": data.get("pagination", {}), "ref": data.get("ref", "HEAD")}
path = f"{PAGES_DIR}/page_{page_num:03d}.json"
with open(path, "w") as f:
    json.dump(out, f, indent=2)
pag = out["pagination"]
print(json.dumps({"saved": path, "count": len(out["data"]), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor")}))
