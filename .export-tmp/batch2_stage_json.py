#!/usr/bin/env python3
"""Stage path->content JSON and flush to workspace (skip existing)."""
import json
import os
import sys

WORKSPACE = "/workspace"
READS = "/workspace/.export-tmp/reads"


def path_to_name(rel: str) -> str:
    return rel.replace("/", "__") + ".content"


def name_to_path(name: str) -> str:
    return name.replace(".content", "").replace("__", "/")


def write_file(rel: str, content: str) -> str:
    full = os.path.join(WORKSPACE, rel)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def stage_json(json_path: str) -> dict:
    data = json.load(open(json_path, encoding="utf-8"))
    os.makedirs(READS, exist_ok=True)
    staged = 0
    for rel, content in data.items():
        if content is None or str(content).startswith("Lovable API error"):
            continue
        with open(os.path.join(READS, path_to_name(rel)), "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
            if content and not content.endswith("\n"):
                f.write("\n")
        staged += 1
    return {"staged": staged}


def flush_reads() -> dict:
    written = skipped = failed = 0
    failures = []
    os.makedirs(READS, exist_ok=True)
    for cf in sorted(f for f in os.listdir(READS) if f.endswith(".content")):
        rel = name_to_path(cf)
        try:
            with open(os.path.join(READS, cf), encoding="utf-8") as f:
                content = f.read()
            r = write_file(rel, content)
            if r == "written":
                written += 1
                os.remove(os.path.join(READS, cf))
            else:
                skipped += 1
                os.remove(os.path.join(READS, cf))
        except Exception as e:
            failed += 1
            failures.append({"path": rel, "error": str(e)})
    return {"written": written, "skipped": skipped, "failed": failed, "failures": failures}


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "flush"
    if cmd == "stage" and len(sys.argv) > 2:
        print(json.dumps(stage_json(sys.argv[2])))
    elif cmd == "flush":
        print(json.dumps(flush_reads()))
    else:
        print("Usage: batch2_stage_json.py [stage FILE|flush]")
        sys.exit(1)
