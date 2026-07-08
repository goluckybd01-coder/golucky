#!/usr/bin/env python3
"""Build prioritized export queue from manifest pages."""
import json, os, sys

PAGES_DIR = "/workspace/.export-tmp/pages"
WORKSPACE = "/workspace"

BINARY_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".svg", ".zip", ".lockb", ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".webm", ".mp3", ".pdf", ".pyc", ".bin"}

PRIORITY_PREFIXES = (
    "src/",
    "supabase/migrations/",
    "supabase/functions/",
    "docs/",
    ".github/workflows/",
    "scripts/",
    "e2e/",
)

def is_binary(path, flagged=False):
    if flagged or os.path.basename(path) == "bun.lockb":
        return True
    return os.path.splitext(path)[1].lower() in BINARY_EXT

def collect_files():
    files = []
    for name in sorted(os.listdir(PAGES_DIR)):
        if not name.endswith(".json"):
            continue
        with open(os.path.join(PAGES_DIR, name)) as f:
            page = json.load(f)
        files.extend(page.get("data", []))
    return files

def priority_key(path):
    for i, p in enumerate(PRIORITY_PREFIXES):
        if path.startswith(p):
            if p == "e2e/" and not path.endswith(".ts"):
                return (len(PRIORITY_PREFIXES), path)
            return (i, path)
    return (len(PRIORITY_PREFIXES), path)

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "stats"
    all_items = collect_files()
    text = [item["path"] for item in all_items if not is_binary(item["path"], item.get("binary", False))]
    pending = [p for p in text if not os.path.exists(os.path.join(WORKSPACE, p))]
    pending.sort(key=priority_key)

    if cmd == "stats":
        src_total = sum(1 for p in text if p.startswith("src/"))
        src_pending = sum(1 for p in pending if p.startswith("src/"))
        print(json.dumps({
            "pages": len([n for n in os.listdir(PAGES_DIR) if n.endswith('.json')]),
            "total_listed": len(all_items),
            "text_files": len(text),
            "pending": len(pending),
            "src_total": src_total,
            "src_pending": src_pending,
            "src_exported": src_total - src_pending,
        }, indent=2))
    elif cmd == "next":
        limit = int(sys.argv[2]) if len(sys.argv) > 2 else 30
        prefix = sys.argv[3] if len(sys.argv) > 3 else "src/"
        batch = [p for p in pending if p.startswith(prefix)][:limit]
        print(json.dumps(batch, indent=2))
    elif cmd == "save-manifest":
        manifest = "/workspace/.export-tmp/manifest.json"
        with open(manifest, "w") as f:
            json.dump({"text_files": text, "total": len(all_items)}, f, indent=2)
        print(f"Wrote {manifest} ({len(text)} text files)")

if __name__ == "__main__":
    main()
