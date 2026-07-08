#!/usr/bin/env python3
"""
Batch 3 continuous export driver.
Reads missing paths, exports via Lovable MCP using CallMcpTool (agent-driven).

Agent loop:
  1. python3 batch3_complete_export.py next 25   -> prints paths to fetch
  2. CallMcpTool read_file for each path
  3. python3 batch3_complete_export.py save-json /path/to/batch.json
  4. Repeat until pending=0
  5. python3 batch3_complete_export.py report
"""
import json
import os
import sys

WORKSPACE = "/workspace"
BATCH_FILE = "/workspace/.export-tmp/batch_3.json"
STATE_FILE = "/workspace/.export-tmp/batch_3_state.json"


def load_batch():
    return json.load(open(BATCH_FILE, encoding="utf-8"))


def load_state():
    if os.path.isfile(STATE_FILE):
        return json.load(open(STATE_FILE, encoding="utf-8"))
    return {"failed": []}


def save_state(state):
    json.dump(state, open(STATE_FILE, "w"), indent=2)


def missing():
    batch = load_batch()
    return [p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))]


def write_file(rel, content):
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def cmd_next(n=25):
    pen = missing()
    batch = pen[: int(n)]
    print(json.dumps({"pending": len(pen), "batch": batch, "count": len(batch)}))


def cmd_save_json(path):
    data = json.load(open(path, encoding="utf-8"))
    written = skipped = failed = 0
    failures = []
    for rel, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            failed += 1
            failures.append(rel)
            continue
        result = write_file(rel, content)
        if result == "written":
            written += 1
        elif result == "skipped":
            skipped += 1
    state = load_state()
    state.setdefault("last_save", {})["written"] = written
    save_state(state)
    print(json.dumps({"written": written, "skipped": skipped, "failed": failed, "failures": failures}))


def cmd_report():
    batch = load_batch()
    existing = [p for p in batch if os.path.isfile(os.path.join(WORKSPACE, p))]
    pen = [p for p in batch if p not in existing]
    state = load_state()
    print(json.dumps({
        "total": len(batch),
        "written": len(existing),
        "skipped": len(existing),
        "missing": len(pen),
        "failed": len(state.get("failed", [])),
        "failures": state.get("failed", [])[:20],
    }))


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "report"
    if cmd == "next":
        cmd_next(sys.argv[2] if len(sys.argv) > 2 else 25)
    elif cmd == "save-json" and len(sys.argv) > 2:
        cmd_save_json(sys.argv[2])
    elif cmd == "report":
        cmd_report()
    else:
        print("Usage: batch3_complete_export.py [next N|save-json FILE|report]")
        sys.exit(1)
