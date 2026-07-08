#!/usr/bin/env python3
"""
Write MCP-fetched files from responses/*.json ({"path","content"}) 
or from stdin blocks (===PATH=== / ===END===).
Then flush to workspace.
"""
import json, os, sys, glob

WORKSPACE = "/workspace"
RESPONSES = "/workspace/.export-tmp/responses"
os.makedirs(RESPONSES, exist_ok=True)

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def save_response(path, content):
    safe = path.replace("/", "__")
    out = os.path.join(RESPONSES, safe + ".json")
    json.dump({"path": path, "content": content}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
    return out

def flush_responses():
    ok = fail = 0
    for rf in glob.glob(os.path.join(RESPONSES, "*.json")):
        try:
            data = json.load(open(rf, encoding="utf-8"))
            path, content = data.get("path"), data.get("content")
            if not path or not content or str(content).startswith("Lovable API error"):
                fail += 1
                os.remove(rf)
                continue
            write_file(path, content)
            ok += 1
            os.remove(rf)
        except Exception:
            fail += 1
    return ok, fail

def parse_blocks(text):
    data = {}
    for part in text.split("===PATH===")[1:]:
        if "===END===" not in part:
            continue
        header, content = part.split("===END===", 1)
        path = header.strip()
        content = content.lstrip("\n")
        if path and content:
            data[path] = content
    return data

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "flush":
        ok, fail = flush_responses()
        print(json.dumps({"ok": ok, "fail": fail}))
    elif len(sys.argv) > 1 and sys.argv[1] == "save" and len(sys.argv) >= 4:
        save_response(sys.argv[2], open(sys.argv[3], encoding="utf-8").read())
        print(f"saved {sys.argv[2]}")
    else:
        text = sys.stdin.read()
        data = parse_blocks(text)
        ok = 0
        for path, content in data.items():
            write_file(path, content)
            ok += 1
        print(json.dumps({"written": ok, "paths": list(data.keys())}))
