#!/usr/bin/env python3
"""Write multiple files from JSON batch via write_batch.py. Usage: python3 run_batch.py <batch.json>"""
import json, subprocess, sys, os

def main():
    batch = sys.argv[1] if len(sys.argv) > 1 else "/workspace/.export-tmp/current_batch.json"
    if not os.path.exists(batch):
        print(json.dumps({"error": f"batch not found: {batch}"}))
        sys.exit(1)
    r = subprocess.run(["python3", "/workspace/.export-tmp/write_batch.py", batch], capture_output=True, text=True)
    print(r.stdout or r.stderr)
    if r.returncode != 0:
        sys.exit(r.returncode)
    # archive batch
    n = len([f for f in os.listdir("/workspace/.export-tmp/batches") if f.endswith(".json")]) + 1 if os.path.isdir("/workspace/.export-tmp/batches") else 1
    os.makedirs("/workspace/.export-tmp/batches", exist_ok=True)
    import shutil
    shutil.move(batch, f"/workspace/.export-tmp/batches/batch_{n:04d}.json")

if __name__ == "__main__":
    main()
