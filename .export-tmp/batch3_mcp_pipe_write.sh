#!/usr/bin/env bash
# Pipe MCP read_file content (from stdin) to workspace via batch3_force_write.py
set -euo pipefail
REL="$1"
python3 /workspace/.export-tmp/batch3_force_write.py "$REL"
