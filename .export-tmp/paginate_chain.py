#!/usr/bin/env python3
"""Merge all page_*.json files and report src file counts."""
import json, os, glob

PAGES = "/workspace/.export-tmp/pages"
BINARY_EXT = {".png",".jpg",".jpeg",".gif",".webp",".ico",".svg",".zip",".lockb",".jfif",".mp4",".webm",".mp3",".pdf",".bin"}

def is_binary(p, flagged=False):
    if flagged or os.path.basename(p) == "bun.lockb":
        return True
    return os.path.splitext(p)[1].lower() in BINARY_EXT

all_items = []
for f in sorted(glob.glob(os.path.join(PAGES, "page_*.json"))):
    page = json.load(open(f))
    all_items.extend(page.get("data", []))

text = [x["path"] for x in all_items if not is_binary(x["path"], x.get("binary", False))]
src = [p for p in text if p.startswith("src/")]
print(json.dumps({
    "pages": len(glob.glob(os.path.join(PAGES, "page_*.json"))),
    "total_listed": len(all_items),
    "text_files": len(text),
    "src_files": len(src),
    "last_page": sorted(glob.glob(os.path.join(PAGES, "page_*.json")))[-1] if glob.glob(os.path.join(PAGES, "page_*.json")) else None,
}, indent=2))
