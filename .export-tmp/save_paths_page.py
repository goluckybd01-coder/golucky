#!/usr/bin/env python3
"""Save page from newline-separated paths. Usage: save_paths_page.py <num> <cursor> <has_more:true|false> < paths.txt"""
import json, sys, os
PAGES_DIR = "/workspace/.export-tmp/pages"
page_num = int(sys.argv[1])
cursor = sys.argv[2] if sys.argv[2] != 'null' else None
has_more = sys.argv[3].lower() == 'true'
paths = [ln.strip() for ln in sys.stdin if ln.strip()]
data = {
    "data": [{"path": p, "binary": p.endswith(('.png','.jpg','.jpeg','.webp','.ico','.svg','.gif','.mp4','.woff','.woff2'))} for p in paths],
    "pagination": {"has_more": has_more, **({"next_cursor": cursor} if cursor else {})},
    "ref": "HEAD"
}
out = f"{PAGES_DIR}/page_{page_num:03d}.json"
with open(out, 'w') as f:
    json.dump(data, f, indent=2)
print(json.dumps({"saved": out, "count": len(paths), "has_more": has_more, "next_cursor": cursor}))
