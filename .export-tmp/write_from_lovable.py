#!/usr/bin/env python3
"""
Write files from Lovable read_file responses stored as individual .content files
in .export-tmp/reads/{safe_path}.content alongside a manifest lines file.

Also supports: python3 write_from_lovable.py batch_NNN.manifest
where manifest is one path per line (paths relative to workspace).
Content files are at .export-tmp/reads/{path with / -> __}.content
"""
import json
import os
import sys

WORKSPACE = "/workspace"
READS_DIR = os.path.join(WORKSPACE, ".export-tmp", "reads")
STATUS_PATH = os.path.join(WORKSPACE, ".export-tmp", "EXPORT_STATUS.json")


def safe_name(path: str) -> str:
    return path.replace("/", "__")


def write_file(rel_path: str, content: str) -> None:
    full = os.path.join(WORKSPACE, rel_path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")


def load_status():
    if os.path.exists(STATUS_PATH):
        with open(STATUS_PATH) as f:
            return json.load(f)
    return {
        "project_id": "a96058c7-1b97-4e98-a71b-6b6121d46efa",
        "exported_file_count": 0,
        "failures": [],
    }


def save_status(status):
    with open(STATUS_PATH, "w") as f:
        json.dump(status, f, indent=2)


def flush_manifest(manifest_path: str):
    status = load_status()
    exported = 0
    with open(manifest_path) as f:
        paths = [ln.strip() for ln in f if ln.strip()]
    for path in paths:
        content_file = os.path.join(READS_DIR, safe_name(path) + ".content")
        if not os.path.exists(content_file):
            status["failures"].append({"path": path, "error": "content file missing"})
            continue
        with open(content_file, encoding="utf-8") as cf:
            content = cf.read()
        try:
            write_file(path, content)
            exported += 1
        except Exception as e:
            status["failures"].append({"path": path, "error": str(e)})
    # recount
    exclude = {".git", ".export-tmp", "tools", "node_modules"}
    count = 0
    for root, dirs, files in os.walk(WORKSPACE):
        dirs[:] = [d for d in dirs if d not in exclude]
        count += len(files)
    status["exported_file_count"] = count
    manifest_json = os.path.join(WORKSPACE, ".export-tmp/manifest.json")
    if os.path.exists(manifest_json):
        with open(manifest_json) as mf:
            m = json.load(mf)
        pending = [p for p in m.get("text_files", []) if not os.path.exists(os.path.join(WORKSPACE, p))]
        status["pending_text_files"] = len(pending)
    save_status(status)
    print(json.dumps({"exported": exported, "failures": len(status["failures"])}))


if __name__ == "__main__":
    os.makedirs(READS_DIR, exist_ok=True)
    if len(sys.argv) < 2:
        print("Usage: write_from_lovable.py <manifest>")
        sys.exit(1)
    flush_manifest(sys.argv[1])
