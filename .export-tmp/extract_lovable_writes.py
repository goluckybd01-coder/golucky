#!/usr/bin/env python3
"""Extract code--write file contents from Lovable list_messages agent-tools dumps."""
import json, os, glob, re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"

def pending_set():
    with open(MANIFEST) as f:
        m = json.load(f)
    src = m.get("src_text_files", [])
    return {p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))}

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def unescape_content(s: str) -> str:
    # Multiple layers of escaping from JSON-in-HTML-in-JSON
    out = s
    for _ in range(8):
        prev = out
        out = (
            out.replace('\\\\\\\"', '"')
               .replace('\\\\n', '\n')
               .replace('\\\\t', '\t')
               .replace('\\\\r', '\r')
               .replace('\\"', '"')
               .replace('\\n', '\n')
               .replace('\\t', '\t')
               .replace('&apos;', "'")
        )
        if out == prev:
            break
    return out

def extract_content_after_marker(part: str) -> str | None:
    # content marker variants
    for marker in ('content\\\\\\": \\\\\\"', 'content\\": \\"', '"content": "'):
        idx = part.find(marker)
        if idx < 0:
            continue
        rest = part[idx + len(marker):]
        # content ends before closing JSON - find unescaped end quote before }">
        # Heuristic: find "}"> or \"}">
        end_patterns = ['\\\\\\"}\\">', '\\"}">', '"}">', '\\"}\\">']
        end = len(rest)
        for ep in end_patterns:
            pos = rest.find(ep)
            if pos > 0:
                end = min(end, pos)
        raw = rest[:end]
        return unescape_content(raw)
    return None

def extract_writes_from_text(text: str) -> dict:
    writes = {}
    for part in text.split('code--write')[1:]:
        m = re.search(r'file_path\\\\\\": \\\\\\"([^\\]+)\\\\\\"', part)
        if not m:
            m = re.search(r'file_path\\": \\"([^\\]+)\\"', part)
        if not m:
            continue
        path = m.group(1)
        content = extract_content_after_marker(part)
        if path and content and len(content) > 10:
            writes[path] = content
    return writes

def main():
    pen = pending_set()
    all_writes = {}
    for f in glob.glob(os.path.join(TOOLS, "*.txt")):
        text = open(f, encoding="utf-8", errors="replace").read()
        if "code--write" not in text:
            continue
        w = extract_writes_from_text(text)
        all_writes.update(w)
    recovered = []
    overwritten = []
    for path, content in sorted(all_writes.items()):
        if not path.startswith("src/"):
            continue
        dest = os.path.join(WORKSPACE, path)
        if os.path.exists(dest) and path not in pen:
            continue
        write_file(path, content)
        if path in pen:
            pen.discard(path)
            recovered.append(path)
        else:
            overwritten.append(path)
        print(f"Wrote {path} ({len(content)} bytes)")
    print(json.dumps({
        "extracted": len(all_writes),
        "recovered": len(recovered),
        "overwritten_missing_from_pending": len(overwritten),
        "paths": recovered + overwritten,
        "pending": len(pen),
    }))

if __name__ == "__main__":
    main()
