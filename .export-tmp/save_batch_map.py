#!/usr/bin/env python3
"""Write path->content map from JSON stdin using export_batch2_worker."""
import json, sys
sys.path.insert(0, "/workspace/.export-tmp")
from export_batch2_worker import write_map, status

data = json.load(sys.stdin)
result = write_map(data)
result["status"] = status()
print(json.dumps(result, indent=2))
