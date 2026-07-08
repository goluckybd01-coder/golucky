#!/usr/bin/env python3
"""Paginate list_files via agent-fed JSON pages. Usage: save agent MCP JSON to /tmp/mcp_page.json then run this."""
import json, glob, os, sys

PAGES_DIR = "/workspace/.export-tmp/pages"
os.makedirs(PAGES_DIR, exist_ok=True)

def save_page(data, page_num=None):
    if page_num is None:
        existing = sorted(glob.glob(f"{PAGES_DIR}/page_*.json"))
        page_num = max([int(os.path.basename(p).replace("page_", "").replace(".json", "")) for p in existing], default=0) + 1
    out = f"{PAGES_DIR}/page_{page_num:03d}.json"
    with open(out, "w") as f:
        json.dump(data, f, indent=2)
    pag = data.get("pagination", {})
    return {"saved": out, "page": page_num, "count": len(data.get("data", [])), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor")}

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "/tmp/mcp_page.json"
    page_num = int(sys.argv[2]) if len(sys.argv) > 2 else None
    with open(src) as f:
        data = json.load(f)
    print(json.dumps(save_page(data, page_num)))
