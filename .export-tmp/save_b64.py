#!/usr/bin/env python3
"""Save base64-encoded file content to incoming batch JSON for flush."""
import json, os, sys, base64, glob

INCOMING = "/workspace/.export-tmp/incoming"
os.makedirs(INCOMING, exist_ok=True)

def batch_path():
    existing = glob.glob(os.path.join(INCOMING, "batch_*.json"))
    nums = []
    for f in existing:
        try:
            nums.append(int(os.path.basename(f).split("_")[1].split(".")[0]))
        except (IndexError, ValueError):
            pass
    n = max(nums, default=0) + 1
    return os.path.join(INCOMING, f"batch_{n:03d}.json")

def main():
    if len(sys.argv) < 2:
        print("Usage: save_b64.py add PATH B64 | flush BATCH_FILE")
        sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "add":
        path, b64 = sys.argv[2], sys.argv[3]
        content = base64.b64decode(b64).decode("utf-8")
        out = batch_path()
        data = {}
        if os.path.exists(out):
            data = json.load(open(out, encoding="utf-8"))
        data[path] = content
        json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False)
        print(json.dumps({"saved": path, "batch": out, "count": len(data)}))
    elif cmd == "write_dict":
        # stdin: JSON {path: content}
        data = json.load(sys.stdin)
        out = batch_path()
        json.dump(data, open(out, "w", encoding="utf-8"), ensure_ascii=False)
        print(json.dumps({"batch": out, "count": len(data)}))
    else:
        print(f"Unknown: {cmd}")

if __name__ == "__main__":
    main()
