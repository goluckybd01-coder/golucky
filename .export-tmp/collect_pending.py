#!/usr/bin/env python3
"""Collect all text file paths from saved pages, prioritize src/."""
import json, os, glob

PAGES = "/workspace/.export-tmp/pages"
WORKSPACE = "/workspace"
BINARY = {".png",".jpg",".jpeg",".gif",".webp",".ico",".svg",".zip",".lockb",".woff",".woff2",".ttf",".eot",".mp4",".webm",".mp3",".pdf",".bin",".pyc"}

def is_binary(path, flagged=False):
    if flagged or os.path.basename(path) == "bun.lockb":
        return True
    return os.path.splitext(path)[1].lower() in BINARY

all_paths = []
for pf in sorted(glob.glob(f"{PAGES}/page_*.json")):
    with open(pf) as f:
        for item in json.load(f).get("data", []):
            p = item["path"]
            if not is_binary(p, item.get("binary", False)):
                all_paths.append(p)

all_paths = sorted(set(all_paths))
pending = [p for p in all_paths if not os.path.exists(os.path.join(WORKSPACE, p))]
src_pending = [p for p in pending if p.startswith("src/")]

out = {
    "all_text": len(all_paths),
    "pending": len(pending),
    "src_pending": src_pending,
    "src_pending_count": len(src_pending),
}
with open("/workspace/.export-tmp/pending.json", "w") as f:
    json.dump(out, f, indent=2)
print(json.dumps({"all_text": len(all_paths), "pending": len(pending), "src_pending": len(src_pending)}, indent=2))
