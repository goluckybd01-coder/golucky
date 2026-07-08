#!/usr/bin/env python3
"""Save a list_files MCP response page and print next cursor."""
import json
import sys

PAGES_DIR = "/workspace/.export-tmp/pages"
STATE = "/workspace/.export-tmp/paginate_state.json"

def main():
    page_num = int(sys.argv[1])
    data = json.load(sys.stdin)
    out = {"data": data["data"], "pagination": data.get("pagination", {})}
    path = f"{PAGES_DIR}/page_{page_num:03d}.json"
    with open(path, "w") as f:
        json.dump(out, f)
    pag = out["pagination"]
    state = {"page": page_num, "has_more": pag.get("has_more", False), "next_cursor": pag.get("next_cursor")}
    with open(STATE, "w") as f:
        json.dump(state, f)
    print(json.dumps(state))

if __name__ == "__main__":
    main()
