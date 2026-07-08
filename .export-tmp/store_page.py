#!/usr/bin/env python3
"""Save MCP list_files/page response from a JSON file."""
import json, sys
from pathlib import Path

def main():
    page_num = int(sys.argv[1])
    src = Path(sys.argv[2])
    data = json.loads(src.read_text())
    out = {"data": data.get("data", []), "pagination": data.get("pagination", {})}
    dest = Path(f"/workspace/.export-tmp/pages/page_{page_num:03d}.json")
    dest.write_text(json.dumps(out, separators=(",", ":")))
    nxt = out["pagination"].get("next_cursor", "")
    print(json.dumps({"saved": str(dest), "count": len(out["data"]), "next_cursor": nxt}))

if __name__ == "__main__":
    main()
