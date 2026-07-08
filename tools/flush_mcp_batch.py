#!/usr/bin/env python3
"""Match recent agent-tools MCP read_file outputs to paths and write to workspace."""
import glob
import json
import os
import re
import sys

TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
WORKSPACE = "/workspace"


def write_file(path: str, content: str) -> str:
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def is_valid_source(content: str) -> bool:
    if not content or len(content) < 30:
        return False
    if content.startswith("{") and '"pagination"' in content[:500]:
        return False
    if "Lovable API error" in content[:200]:
        return False
    if content.startswith("import ") or content.startswith("export ") or content.startswith("/*") or content.startswith("//") or content.startswith("{"):
        return True
    if content.startswith("CREATE ") or content.startswith("--") or content.startswith("WITH "):
        return True
    return False


def detect_path(content: str, candidates: list[str]) -> str | None:
    if not is_valid_source(content):
        return None

    basename_map: dict[str, list[str]] = {}
    for p in candidates:
        base = os.path.splitext(os.path.basename(p))[0]
        basename_map.setdefault(base, []).append(p)

    # Unique basename match via export name
    patterns = [
        r"export\s+default\s+(?:function\s+)?(\w+)",
        r"export\s+(?:const|function)\s+(\w+)",
        r"export\s+default\s+(\w+)",
        r"export\s+function\s+(\w+)",
        r"export\s+class\s+(\w+)",
    ]
    for pat in patterns:
        for m in re.finditer(pat, content):
            name = m.group(1)
            hits = basename_map.get(name, [])
            if len(hits) == 1:
                return hits[0]

    # SQL migration: look for unique table/function names in path
    for p in candidates:
        if p.endswith(".sql"):
            stem = os.path.basename(p).replace(".sql", "")
            if stem in content[:2000]:
                return p

    # Hook/lib: use basename in first 4k chars
    for base, paths in basename_map.items():
        if len(paths) != 1:
            continue
        if re.search(rf"\b{re.escape(base)}\b", content[:4000]):
            return paths[0]

    # Component file comment or path-specific strings
    for p in candidates:
        stem = os.path.splitext(os.path.basename(p))[0]
        if len(stem) > 8 and stem in content:
            others = [x for x in candidates if x != p and stem in x]
            if not others:
                return p

    return None


def flush(paths: list[str]) -> dict:
    remaining = [p for p in paths if not os.path.isfile(os.path.join(WORKSPACE, p))]
    written = skipped = 0
    matched = []
    seen_content: set[str] = set()

    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        if not remaining:
            break
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or content in seen_content:
            continue
        path = detect_path(content, remaining)
        if not path:
            continue
        seen_content.add(content)
        status = write_file(path, content)
        if status == "written":
            written += 1
            matched.append(path)
            remaining.remove(path)
        else:
            skipped += 1
            remaining.remove(path)

    return {
        "written": written,
        "skipped": skipped,
        "matched": matched,
        "remaining": remaining,
        "pending_src": len([p for p in json.load(open("/workspace/.export-tmp/pending_all.json"))["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))]),
    }


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "pending":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 25
        data = json.load(open("/workspace/.export-tmp/pending_all.json"))
        paths = [p for p in data["pending_src_paths"] if not os.path.isfile(os.path.join(WORKSPACE, p))]
        print(json.dumps(paths[:n]))
        return
    if sys.argv[1:]:
        paths = sys.argv[1:]
    else:
        paths = json.load(sys.stdin)
    print(json.dumps(flush(paths), indent=2))


if __name__ == "__main__":
    main()
