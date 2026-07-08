#!/usr/bin/env python3
"""Watch incoming/*.json and bulk-write to workspace. Run in tmux."""
import glob
import json
import os
import time

INCOMING = "/workspace/.export-tmp/incoming"
WORKSPACE = "/workspace"

def flush():
    written = skipped = 0
    for jf in sorted(glob.glob(os.path.join(INCOMING, "*.json"))):
        try:
            data = json.load(open(jf, encoding="utf-8"))
            for path, content in data.items():
                full = os.path.join(WORKSPACE, path)
                if os.path.exists(full):
                    skipped += 1
                    continue
                if not content or str(content).startswith("Lovable API error"):
                    continue
                os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
                with open(full, "w", encoding="utf-8", newline="\n") as f:
                    f.write(content)
                    if content and not content.endswith("\n"):
                        f.write("\n")
                written += 1
            os.remove(jf)
        except Exception as e:
            print(f"ERR {jf}: {e}")
    return written, skipped

if __name__ == "__main__":
    os.makedirs(INCOMING, exist_ok=True)
    total_w = total_s = 0
    while True:
        w, s = flush()
        if w or s:
            total_w += w
            total_s += s
            print(json.dumps({"written": w, "skipped": s, "total_written": total_w}))
        pending = len(glob.glob(os.path.join(INCOMING, "*.json")))
        if pending == 0 and total_w == 0:
            time.sleep(0.5)
        else:
            time.sleep(0.2)
        # Exit when no incoming files for 2 seconds and we've processed something
        if pending == 0 and total_w > 0:
            time.sleep(1)
            if not glob.glob(os.path.join(INCOMING, "*.json")):
                break
    print(json.dumps({"done": True, "total_written": total_w, "total_skipped": total_s}))
