#!/usr/bin/env python3
"""
Build src_paths.json from page manifests and export pending list.
Run after saving all page_*.json files under .export-tmp/pages/
"""
import json, os, glob

PAGES = "/workspace/.export-tmp/pages"
WORKSPACE = "/workspace"
OUT = "/workspace/.export-tmp/src_paths.json"
BINARY_EXT = {".png",".jpg",".jpeg",".gif",".webp",".ico",".svg",".zip",".lockb",".jfif",".mp4",".webm",".mp3",".pdf",".bin"}

def is_binary(path, flagged=False):
    if flagged or os.path.basename(path) == "bun.lockb":
        return True
    return os.path.splitext(path)[1].lower() in BINARY_EXT

paths = []
for pf in sorted(glob.glob(f"{PAGES}/page_*.json")):
    with open(pf) as f:
        for item in json.load(f).get("data", []):
            p = item["path"]
            if p.startswith("src/") and not is_binary(p, item.get("binary", False)):
                paths.append(p)

paths = sorted(set(paths))
pending = [p for p in paths if not os.path.exists(os.path.join(WORKSPACE, p))]
with open(OUT, "w") as f:
    json.dump({"all": paths, "pending": pending}, f, indent=2)
print(json.dumps({"total": len(paths), "pending": len(pending), "exported": len(paths)-len(pending)}, indent=2))
