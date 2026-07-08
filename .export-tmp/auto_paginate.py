#!/usr/bin/env python3
"""Helper: print next cursor for agent MCP loop; save inbox pages to pages/."""
import json, glob, os, sys

PAGES_DIR = "/workspace/.export-tmp/pages"
INBOX = "/workspace/.export-tmp/mcp_inbox"

def last_state():
    pages = sorted(glob.glob(f"{PAGES_DIR}/page_*.json"))
    if not pages:
        return {"next_page": 1, "cursor": None}
    last = pages[-1]
    num = int(os.path.basename(last).replace("page_", "").replace(".json", ""))
    with open(last) as f:
        data = json.load(f)
    pag = data.get("pagination", {})
    if not pag.get("has_more"):
        return {"done": True, "pages": len(pages), "last_page": num}
    return {"next_page": num + 1, "cursor": pag.get("next_cursor"), "last_page": num}

def flush_inbox():
    saved = []
    for f in sorted(glob.glob(f"{INBOX}/page_*.json")):
        num = int(os.path.basename(f).replace("page_", "").replace(".json", ""))
        with open(f) as fh:
            data = json.load(fh)
        out = {"data": data["data"], "pagination": data.get("pagination", {}), "ref": data.get("ref", "HEAD")}
        dest = f"{PAGES_DIR}/page_{num:03d}.json"
        with open(dest, "w") as fh:
            json.dump(out, fh, indent=2)
        saved.append(dest)
    return saved

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "flush":
        print(json.dumps({"flushed": flush_inbox()}))
    else:
        print(json.dumps(last_state()))
