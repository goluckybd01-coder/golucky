#!/usr/bin/env python3
"""Write all files from .export-tmp/staging/ to workspace. Overwrites."""
import json
import os

WORKSPACE = "/workspace"
STAGING = "/workspace/.export-tmp/staging"
PENDING = "/workspace/.export-tmp/pending_all.json"


def main():
    os.makedirs(STAGING, exist_ok=True)
    written = failed = 0
    for name in sorted(os.listdir(STAGING)):
        src = os.path.join(STAGING, name)
        if not os.path.isfile(src):
            continue
        rel = name.replace("__", "/")
        dst = os.path.join(WORKSPACE, rel)
        try:
            with open(src, encoding="utf-8") as f:
                content = f.read()
            if not content or content.startswith("Lovable API error"):
                raise ValueError("invalid content")
            head = content.lstrip()[:20]
            if rel.endswith(".tsx") and (head.startswith("@import") or head.startswith("@tailwind")):
                raise ValueError("corrupted tsx")
            os.makedirs(os.path.dirname(dst) or WORKSPACE, exist_ok=True)
            with open(dst, "w", encoding="utf-8", newline="\n") as f:
                f.write(content)
                if not content.endswith("\n"):
                    f.write("\n")
            os.remove(src)
            print(f"OK {rel} ({len(content)} bytes)")
            written += 1
        except Exception as e:
            print(f"FAIL {rel}: {e}")
            failed += 1
    ps = -1
    if os.path.isfile(PENDING):
        data = json.load(open(PENDING, encoding="utf-8"))
        ps = len([p for p in data.get("pending_src_paths", []) if not os.path.isfile(os.path.join(WORKSPACE, p))])
    print(json.dumps({"written": written, "failed": failed, "pending_src": ps}))


if __name__ == "__main__":
    main()
