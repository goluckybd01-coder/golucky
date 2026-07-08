#!/usr/bin/env python3
"""Write batch_0 files from .export-tmp/cache/{path with / -> __}. Skips existing."""
import json, os

WORKSPACE = "/workspace"
CACHE = "/workspace/.export-tmp/cache"
BATCH = "/workspace/.export-tmp/batch_0.json"


def cache_key(path: str) -> str:
    return path.replace("/", "__")


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
    paths = json.load(open(BATCH, encoding="utf-8"))
    exported = skipped = missing_cache = 0
    for path in paths:
        ck = os.path.join(CACHE, cache_key(path))
        if not os.path.isfile(ck):
            if not os.path.isfile(os.path.join(WORKSPACE, path)):
                missing_cache += 1
            continue
        with open(ck, encoding="utf-8") as f:
            content = f.read()
        result = write_file(path, content)
        if result == "skipped":
            skipped += 1
        else:
            exported += 1
    on_disk = sum(1 for p in paths if os.path.isfile(os.path.join(WORKSPACE, p)))
    print(json.dumps({
        "exported": exported,
        "skipped": skipped,
        "missing_cache": missing_cache,
        "on_disk": on_disk,
        "total": len(paths),
    }, indent=2))


if __name__ == "__main__":
    main()
