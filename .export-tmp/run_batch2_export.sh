#!/usr/bin/env bash
# Flush staged content and report batch_2 status
set -euo pipefail
python3 /workspace/.export-tmp/flush_content.py
python3 /workspace/.export-tmp/recover_batch2.py
python3 /workspace/.export-tmp/auto_write_batch2.py
python3 /workspace/.export-tmp/export_batch2_worker.py status
