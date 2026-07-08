#!/usr/bin/env python3
"""Merge paginated list_files JSON pages and output export manifest."""
import json
import os
import sys

PAGES_DIR = "/workspace/.export-tmp/pages"
MANIFEST = "/workspace/.export-tmp/manifest.json"
SKIPPED = "/workspace/.export-tmp/skipped_binary.txt"

BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
    ".zip", ".lockb", ".woff", ".woff2", ".ttf", ".eot",
    ".mp4", ".webm", ".mp3", ".pdf", ".bin",
}

def is_binary_path(path: str, flagged_binary: bool) -> bool:
    if flagged_binary:
        return True
    base = os.path.basename(path)
    if base == "bun.lockb":
        return True
    ext = os.path.splitext(path)[1].lower()
    return ext in BINARY_EXTENSIONS

def main():
    all_files = []
    for name in sorted(os.listdir(PAGES_DIR)):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(PAGES_DIR, name)) as f:
            page = json.load(f)
        all_files.extend(page.get("data", []))

    text_files = []
    skipped = []
    for item in all_files:
        path = item["path"]
        if is_binary_path(path, item.get("binary", False)):
            skipped.append(path)
        else:
            text_files.append(path)

    with open(MANIFEST, "w") as f:
        json.dump({"text_files": text_files, "total": len(all_files)}, f, indent=2)
    with open(SKIPPED, "w") as f:
        f.write("\n".join(skipped))
    print(f"Total: {len(all_files)}, text: {len(text_files)}, skipped: {len(skipped)}")

if __name__ == "__main__":
    main()
