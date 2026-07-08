#!/usr/bin/env python3
"""Build pending export list from complete pagination pages 022+."""
import json, os, glob

PAGES_DIR = "/workspace/.export-tmp/pages"
WORKSPACE = "/workspace"
BINARY_EXT = {".png",".jpg",".jpeg",".gif",".webp",".ico",".svg",".zip",".lockb",".jfif",".mp4",".webm",".mp3",".pdf",".bin",".woff",".woff2",".ttf",".eot"}

def is_binary(p, flagged=False):
    if flagged or os.path.basename(p) == "bun.lockb":
        return True
    return os.path.splitext(p)[1].lower() in BINARY_EXT

def collect_paths(prefix=None):
    seen = {}
    for f in sorted(glob.glob(os.path.join(PAGES_DIR, "page_*.json"))):
        page = json.load(open(f))
        for item in page.get("data", []):
            seen[item["path"]] = item
    text = []
    for p, item in sorted(seen.items()):
        if is_binary(p, item.get("binary", False)):
            continue
        if prefix and not p.startswith(prefix):
            continue
        text.append(p)
    return text

def main():
    all_text = collect_paths()
    src_text = collect_paths("src/")
    pending_all = [p for p in all_text if not os.path.exists(os.path.join(WORKSPACE, p))]
    pending_src = [p for p in src_text if not os.path.exists(os.path.join(WORKSPACE, p))]
    critical_prefixes = [
        "package.json", "package-lock.json", "index.html", "vite.config.ts",
        "tsconfig", "tailwind.config.ts", "postcss.config.js", "eslint.config.js",
        "components.json", "playwright.config.ts", "vitest.config.ts",
        "supabase/", "scripts/", "public/", ".github/workflows/build.yml",
        ".github/workflows/test.yml", ".github/workflows/typecheck.yml",
    ]
    pending_critical = []
    for p in all_text:
        if os.path.exists(os.path.join(WORKSPACE, p)):
            continue
        if any(p == cp or p.startswith(cp) for cp in critical_prefixes):
            pending_critical.append(p)
    out = {
        "all_text": len(all_text),
        "src_text": len(src_text),
        "pending_all": len(pending_all),
        "pending_src": len(pending_src),
        "pending_critical": len(pending_critical),
        "export_order": pending_src + [p for p in pending_critical if p not in pending_src],
    }
    with open("/workspace/.export-tmp/export_order.json", "w") as f:
        json.dump(out, f, indent=2)
    with open("/workspace/.export-tmp/export_queue.txt", "w") as f:
        f.write("\n".join(out["export_order"]))
    print(json.dumps({k: out[k] for k in out if k != "export_order"}, indent=2))

if __name__ == "__main__":
    main()
