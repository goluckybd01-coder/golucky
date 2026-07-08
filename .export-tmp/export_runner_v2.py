#!/usr/bin/env python3
"""
Continuous export runner: writes pending paths to queue, 
agent fills responses in responses/ as {path_safe}.json with {"path","content"}.
"""
import json, os, sys, glob, time, hashlib

WORKSPACE = "/workspace"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"
QUEUE = "/workspace/.export-tmp/export_queue.json"
RESPONSES = "/workspace/.export-tmp/responses"
os.makedirs(RESPONSES, exist_ok=True)

def safe(path):
    return path.replace("/", "__")

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

def flush_responses():
    ok = fail = 0
    failures = []
    for rf in glob.glob(os.path.join(RESPONSES, "*.json")):
        try:
            data = json.load(open(rf, encoding="utf-8"))
            path = data.get("path")
            content = data.get("content")
            if not path or content is None:
                fail += 1
                failures.append(rf)
                continue
            if isinstance(content, str) and content.startswith("Lovable API error"):
                fail += 1
                failures.append(path)
                os.remove(rf)
                continue
            write_file(path, content)
            ok += 1
            os.remove(rf)
        except Exception as e:
            fail += 1
            failures.append({"file": rf, "error": str(e)})
    return ok, fail, failures

def cmd_status():
    pen = pending()
    resp_pending = len(glob.glob(os.path.join(RESPONSES, "*.json")))
    exp = 870 - len(pen)
    print(json.dumps({"src_total": 870, "exported": exp, "pending": len(pen), "responses_staged": resp_pending}))

def cmd_next(n=50):
    pen = pending()
    batch = pen[:n]
    out = {"batch": batch, "count": len(batch), "pending": len(pen)}
    with open(QUEUE, "w") as f:
        json.dump(out, f, indent=2)
    print(json.dumps(out))

def cmd_save(path, content_file):
    with open(content_file, encoding="utf-8") as f:
        content = f.read()
    out = os.path.join(RESPONSES, safe(path) + ".json")
    json.dump({"path": path, "content": content}, open(out, "w", encoding="utf-8"), ensure_ascii=False)
    print(json.dumps({"saved": path, "bytes": len(content)}))

def cmd_flush():
    ok, fail, failures = flush_responses()
    cmd_status()
    print(json.dumps({"flushed_ok": ok, "flushed_fail": fail, "failures": failures[:10]}))

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "status":
        cmd_status()
    elif cmd == "next":
        cmd_next(int(sys.argv[2]) if len(sys.argv) > 2 else 50)
    elif cmd == "save":
        cmd_save(sys.argv[2], sys.argv[3])
    elif cmd == "flush":
        cmd_flush()
    else:
        print("Usage: export_runner_v2.py [status|next N|save PATH CONTENT_FILE|flush]")
