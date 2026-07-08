#!/usr/bin/env bash
# Persist one file: read content from stdin, write via batch2_stage_write.py
set -euo pipefail
REL="${1:?usage: export_one.sh <rel-path>}"
python3 /workspace/.export-tmp/batch2_stage_write.py "$REL"
