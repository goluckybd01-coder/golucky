#!/usr/bin/env python3
"""Read Lovable files via agent MCP (stdin JSONL) into staging, then mcp_immediate_write."""
import json
import subprocess
import sys
from pathlib import Path

STAGING = Path("/workspace/.export-tmp/lovable_fetched")
WRITE = "/workspace/tools/mcp_immediate_write.py"
MANIFEST = Path("/workspace/.export-tmp/batch_missing_paths.json")


def stage_one(rel: str, content: str) -> None:
    STAGING.mkdir(parents=True, exist_ok=True)
    (STAGING / rel.replace("/", "__")).write_text(content, encoding="utf-8")


def write_one(rel: str, content: str) -> None:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode != 0:
        raise RuntimeError((r.stderr or r.stdout).strip())
    print((r.stdout or "").strip())


def main():
  mode = sys.argv[1] if len(sys.argv) > 1 else "flush"
  if mode == "ingest":
    for line in sys.stdin:
      line = line.strip()
      if not line:
        continue
      obj = json.loads(line)
      stage_one(obj["path"], obj["content"])
      print(f"staged {obj['path']} ({len(obj['content'])} bytes)")
    return
  paths = json.loads(MANIFEST.read_text(encoding="utf-8"))
  written = 0
  failures = []
  for rel in paths:
    stage = STAGING / rel.replace("/", "__")
    if not stage.is_file():
      failures.append({"path": rel, "error": "not staged"})
      continue
    try:
      content = stage.read_text(encoding="utf-8")
      if not content.strip():
        raise RuntimeError("empty")
      write_one(rel, content)
      written += 1
    except Exception as e:
      failures.append({"path": rel, "error": str(e)})
  print(json.dumps({"written": written, "failed": len(failures), "failures": failures}, indent=2))
  return 0 if not failures else 1


if __name__ == "__main__":
  raise SystemExit(main())
