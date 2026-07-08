#!/usr/bin/env python3
"""List src text files from pages missing on disk."""
import json, glob, os

PAGES_DIR = "/workspace/.export-tmp/pages"
WORKSPACE = "/workspace"
BINARY_EXT = {'.png','.jpg','.jpeg','.gif','.webp','.ico','.svg','.zip','.lockb','.woff','.woff2','.ttf','.eot','.mp4','.webm','.mp3','.pdf','.pyc','.jfif','.bin'}

def is_binary(path, flagged):
    if flagged: return True
    if os.path.basename(path) == 'bun.lockb': return True
    return os.path.splitext(path)[1].lower() in BINARY_EXT

all_items = {}
for p in sorted(glob.glob(f'{PAGES_DIR}/page_*.json')):
    with open(p) as f:
        page = json.load(f)
    for item in page.get('data', []):
        all_items[item['path']] = item.get('binary', False)

src = sorted([p for p, b in all_items.items() if p.startswith('src/') and not is_binary(p, b)])
pending = [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]
print(json.dumps({'src_total': len(src), 'pending': len(pending), 'paths': pending[:50]}))
