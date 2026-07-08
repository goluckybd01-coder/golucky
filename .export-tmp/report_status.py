#!/usr/bin/env python3
"""Full export status report."""
import json, os, glob

WORKSPACE = "/workspace"
PAGES_DIR = "/workspace/.export-tmp/pages"
BINARY_EXT = {".png",".jpg",".jpeg",".gif",".webp",".ico",".svg",".zip",".lockb",".jfif",".mp4",".webm",".mp3",".pdf",".bin",".woff",".woff2",".ttf",".eot"}

def is_binary(p, flagged=False):
    if flagged or os.path.basename(p) == "bun.lockb":
        return True
    return os.path.splitext(p)[1].lower() in BINARY_EXT

def collect_text_paths():
    seen = {}
    for f in sorted(glob.glob(os.path.join(PAGES_DIR, "page_*.json"))):
        page = json.load(open(f))
        for item in page.get("data", []):
            seen[item["path"]] = item
    text = []
    for p, item in sorted(seen.items()):
        if not is_binary(p, item.get("binary", False)):
            text.append(p)
    return text

def main():
    if os.path.exists("/workspace/.export-tmp/pending_sorted.json"):
        queue = json.load(open("/workspace/.export-tmp/pending_sorted.json"))
    else:
        queue = collect_text_paths()
    src_queue = [p for p in queue if p.startswith("src/")]
    pending = [p for p in queue if not os.path.exists(os.path.join(WORKSPACE, p))]
    src_pending = [p for p in src_queue if not os.path.exists(os.path.join(WORKSPACE, p))]
    src_exported = len(src_queue) - len(src_pending)
    pages = sorted(glob.glob(os.path.join(PAGES_DIR, "page_*.json")))
    has_more = False
    if pages:
        last = json.load(open(pages[-1]))
        has_more = last.get("pagination", {}).get("has_more", False)
    status = {
        "pagination_pages": len(pages),
        "pagination_complete": not has_more,
        "src_total_in_queue": len(src_queue),
        "src_exported": src_exported,
        "src_pending": len(src_pending),
        "total_pending": len(pending),
        "failures": json.load(open("/workspace/.export-tmp/EXPORT_STATUS.json")).get("failures", []) if os.path.exists("/workspace/.export-tmp/EXPORT_STATUS.json") else [],
    }
    with open("/workspace/.export-tmp/EXPORT_STATUS.json", "w") as f:
        json.dump({**status, "project_id": "a96058c7-1b97-4e98-a71b-6b6121d46efa"}, f, indent=2)
    print(json.dumps(status, indent=2))

if __name__ == "__main__":
    main()
