#!/usr/bin/env python3
"""Build full_manifest.json from all page files."""
import json, os, glob

PAGES_DIR = "/workspace/.export-tmp/pages"
OUT = "/workspace/.export-tmp/full_manifest.json"
BINARY_EXT = {'.png','.jpg','.jpeg','.gif','.webp','.ico','.svg','.zip','.lockb','.woff','.woff2','.ttf','.eot','.mp4','.webm','.mp3','.pdf','.pyc','.jfif','.bin'}

def is_binary(path, flagged):
    if flagged: return True
    if os.path.basename(path) == 'bun.lockb': return True
    ext = os.path.splitext(path)[1].lower()
    return ext in BINARY_EXT

all_items = {}
for p in sorted(glob.glob(f'{PAGES_DIR}/page_*.json')):
    with open(p) as f:
        page = json.load(f)
    for item in page.get('data', []):
        all_items[item['path']] = item.get('binary', False)

text_files = sorted([p for p, b in all_items.items() if not is_binary(p, b)])
src_files = sorted([p for p in text_files if p.startswith('src/')])
manifest = {
    'total_listed': len(all_items),
    'text_files': text_files,
    'src_text_files': src_files,
    'text_count': len(text_files),
    'src_count': len(src_files),
}
with open(OUT, 'w') as f:
    json.dump(manifest, f, indent=2)
print(json.dumps({'total': len(all_items), 'text': len(text_files), 'src': len(src_files)}))
