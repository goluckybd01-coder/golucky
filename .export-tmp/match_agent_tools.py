#!/usr/bin/env python3
"""Match agent-tools/*.txt content to pending manifest paths and write."""
import json, os, glob, re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"

def pending():
    with open(MANIFEST) as f:
        m = json.load(f)
    src = m.get("src_text_files", [])
    return [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def guess_path(content, pending_paths):
    if not content or len(content) < 80:
        return None
    if content.startswith("{") and '"pagination"' in content[:400]:
        return None
    if "Lovable API error" in content[:100]:
        return None
    # export default Name -> src/.../Name.tsx
    m = re.search(r'export\s+default\s+(?:function\s+)?(\w+)', content)
    if m:
        name = m.group(1)
        candidates = [p for p in pending_paths if p.endswith(f"/{name}.tsx") or p.endswith(f"/{name}.ts")]
        if len(candidates) == 1:
            return candidates[0]
        if len(candidates) > 1:
            # prefer shorter path
            return sorted(candidates, key=len)[0]
    # named export const X
    m = re.search(r'export\s+const\s+(\w+)\s*=', content)
    if m:
        name = m.group(1)
        candidates = [p for p in pending_paths if name in p]
        if len(candidates) == 1:
            return candidates[0]
    return None

def main():
    pen = set(pending())
    recovered = []
    for f in glob.glob(os.path.join(TOOLS, "*.txt")):
        with open(f, encoding="utf-8", errors="replace") as inf:
            c = inf.read().strip()
        path = guess_path(c, pen)
        if path:
            write_file(path, c)
            pen.discard(path)
            recovered.append(path)
            print(f"Matched {path} from {os.path.basename(f)}")
    print(json.dumps({"recovered": len(recovered), "paths": recovered, "pending": len(pen)}))

if __name__ == "__main__":
    main()
