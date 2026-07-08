#!/usr/bin/env python3
"""Paginate all files via MCP responses saved incrementally.
Agent calls list_files and pipes JSON to: python3 save_page.py N
This script tracks cursor in cursor.txt for chaining.
"""
import json, os, sys

CURSOR_FILE = "/workspace/.export-tmp/cursor.txt"
PAGE_FILE = "/workspace/.export-tmp/page_num.txt"

def get_page_num():
    if os.path.exists(PAGE_FILE):
        return int(open(PAGE_FILE).read().strip()) + 1
    # count existing pages
    pages = [f for f in os.listdir("/workspace/.export-tmp/pages") if f.startswith("page_") and f.endswith(".json")]
    return len(pages) + 1

def main():
    if len(sys.argv) < 2:
        print("Usage: echo '<json>' | python3 save_page.py save")
        print("       python3 paginate_status.py")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "status":
        pages = sorted(f for f in os.listdir("/workspace/.export-tmp/pages") if f.endswith(".json"))
        last = None
        if pages:
            last = json.load(open(f"/workspace/.export-tmp/pages/{pages[-1]}"))
        print(json.dumps({
            "pages": len(pages),
            "last_has_more": last["pagination"].get("has_more") if last else None,
            "next_cursor": last["pagination"].get("next_cursor", "") if last else "",
        }))
        return
    # save mode - read JSON from stdin
    resp = json.load(sys.stdin)
    n = get_page_num()
    out = {"data": resp["data"], "pagination": resp.get("pagination", {})}
    path = f"/workspace/.export-tmp/pages/page_{n:03d}.json"
    with open(path, "w") as f:
        json.dump(out, f)
    with open(PAGE_FILE, "w") as f:
        f.write(str(n))
    cursor = out["pagination"].get("next_cursor", "")
    with open(CURSOR_FILE, "w") as f:
        f.write(cursor)
    print(json.dumps({"page": n, "path": path, "count": len(out["data"]), "has_more": out["pagination"].get("has_more"), "next_cursor": cursor}))

if __name__ == "__main__":
    main()
