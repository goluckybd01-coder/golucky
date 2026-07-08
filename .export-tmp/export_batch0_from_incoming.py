#!/usr/bin/env python3
"""
Batch export batch_0.json from Lovable via MCP content files in incoming/.
Usage: save JSON {"path": "...", "content": "..."} to incoming/batch_NNN.json then:
  python3 export_batch0_from_incoming.py
"""
import json, os, glob

WORKSPACE = "/workspace"
BATCH = "/workspace/.export-tmp/batch_0.json"
INCOMING = "/workspace/.export-tmp/incoming"

def write_file(path, content):
    dest = os.path.join(WORKSPACE, path)
    if os.path.isfile(dest):
        return "skipped"
    os.makedirs(os.path.dirname(dest) or WORKSPACE, exist_ok=True)
    with open(dest, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "exported"

def main():
    targets = set(json.load(open(BATCH, encoding="utf-8")))
    exported = skipped = fail = 0
    failures = []
    for jf in sorted(glob.glob(os.path.join(INCOMING, "batch_*.json"))):
        try:
            data = json.load(open(jf, encoding="utf-8"))
            for path, content in data.items():
                if path not in targets:
                    continue
                if content is None or str(content).startswith("Lovable API error"):
                    fail += 1
                    failures.append({"path": path, "error": "invalid content"})
                    continue
                result = write_file(path, content)
                if result == "skipped":
                    skipped += 1
                else:
                    exported += 1
            os.remove(jf)
        except Exception as e:
            fail += 1
            failures.append({"file": jf, "error": str(e)})
    missing = [p for p in targets if not os.path.isfile(os.path.join(WORKSPACE, p))]
    print(json.dumps({
        "exported": exported,
        "skipped": skipped,
        "failures": failures,
        "failure_count": fail,
        "missing": len(missing),
        "on_disk": len(targets) - len(missing),
    }, indent=2))

if __name__ == "__main__":
    main()
