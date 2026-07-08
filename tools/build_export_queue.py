#!/usr/bin/env python3
"""Build export queue from paginated Lovable list_files pages."""
import json
import os
import glob

PAGES_DIR = "/workspace/.export-tmp/pages"
WORKSPACE = "/workspace"
BINARY_EXT = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
    ".zip", ".lockb", ".woff", ".woff2", ".ttf", ".eot",
    ".mp4", ".webm", ".mp3", ".pdf", ".bin", ".jfif",
}

def is_binary(path: str, flagged: bool = False) -> bool:
    if flagged or os.path.basename(path) == "bun.lockb":
        return True
    return os.path.splitext(path)[1].lower() in BINARY_EXT

def main():
    all_items = []
    for f in sorted(glob.glob(os.path.join(PAGES_DIR, "page_*.json"))):
        with open(f) as fh:
            page = json.load(fh)
        all_items.extend(page.get("data", []))

    text_paths = []
    for item in all_items:
        p = item["path"]
        if not is_binary(p, item.get("binary", False)):
            text_paths.append(p)

    pending = []
    for p in sorted(set(text_paths)):
        if not os.path.exists(os.path.join(WORKSPACE, p)):
            pending.append(p)

    src_pending = [p for p in pending if p.startswith("src/")]
    out = {
        "total_listed": len(all_items),
        "text_paths": len(set(text_paths)),
        "pending_total": len(pending),
        "pending_src": len(src_pending),
        "pending": pending,
        "pending_src_paths": src_pending,
    }
    with open("/workspace/.export-tmp/pending_all.json", "w") as f:
        json.dump(out, f, indent=2)
    print(json.dumps({k: out[k] for k in out if k not in ("pending", "pending_src_paths")}, indent=2))
    print(f"First 10 pending src: {src_pending[:10]}")

if __name__ == "__main__":
    main()
