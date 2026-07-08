#!/usr/bin/env python3
"""Save content from file arg to workspace path via batch2_complete_export."""
import sys
sys.path.insert(0, "/workspace/.export-tmp")
from batch2_complete_export import write_file
import json

if __name__ == "__main__":
    rel = sys.argv[1]
    content_path = sys.argv[2]
    content = open(content_path, encoding="utf-8").read()
    if not content or content.startswith("Lovable API error"):
        print(json.dumps({"path": rel, "result": "failed"}))
        sys.exit(1)
    result = write_file(rel, content)
    print(json.dumps({"path": rel, "result": result, "bytes": len(content)}))
