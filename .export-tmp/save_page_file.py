#!/usr/bin/env python3
"""Save MCP list_files response from a JSON file argument."""
import json, sys
n = int(sys.argv[1])
with open(sys.argv[2]) as f:
    resp = json.load(f)
out = {"data": resp["data"], "pagination": resp.get("pagination", {})}
path = f"/workspace/.export-tmp/pages/page_{n:03d}.json"
with open(path, "w") as f:
    json.dump(out, f, separators=(",", ":"))
pag = out["pagination"]
print(json.dumps({"saved": path, "count": len(out["data"]), "has_more": pag.get("has_more"), "next_cursor": pag.get("next_cursor", "")}))
