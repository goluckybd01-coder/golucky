#!/usr/bin/env python3
"""Build file manifest from paginated list_files JSON pages and export status."""
import json
import os
import sys

PAGES_DIR = "/workspace/.export-tmp/pages"
MANIFEST = "/workspace/.export-tmp/manifest.json"
SKIPPED = "/workspace/.export-tmp/skipped_binary.txt"
WORKSPACE = "/workspace"

BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg",
    ".zip", ".lockb", ".woff", ".woff2", ".ttf", ".eot",
    ".mp4", ".webm", ".mp3", ".pdf", ".pyc",
}

def is_binary_path(path: str, flagged_binary: bool) -> bool:
    if flagged_binary:
        return True
    if os.path.basename(path) == "bun.lockb":
        return True
    ext = os.path.splitext(path)[1].lower()
    return ext in BINARY_EXTENSIONS

def main():
    all_files = []
    if not os.path.isdir(PAGES_DIR):
        print(f"No pages dir: {PAGES_DIR}", file=sys.stderr)
        sys.exit(1)
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
        json.dump({"text_files": text_files, "total": len(all_files), "skipped_count": len(skipped)}, f, indent=2)
    with open(SKIPPED, "w") as f:
        f.write("\n".join(skipped))

    exported = 0
    pending = []
    for p in text_files:
        full = os.path.join(WORKSPACE, p)
        if os.path.exists(full):
            exported += 1
        else:
            pending.append(p)

    print(json.dumps({
        "total_files": len(all_files),
        "text_files": len(text_files),
        "skipped_binary": len(skipped),
        "already_exported": exported,
        "pending": len(pending),
        "package_json_exists": os.path.exists(os.path.join(WORKSPACE, "package.json")),
    }, indent=2))

if __name__ == "__main__":
    main()
