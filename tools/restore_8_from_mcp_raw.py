#!/usr/bin/env python3
import subprocess, sys, os, json
WRITE = '/workspace/tools/mcp_immediate_write.py'
RAW = '/workspace/.export-tmp/mcp_raw'
MAP = {
    'CommissionDetailsModal.tsx': 'src/components/CommissionDetailsModal.tsx',
    'InvitationRulesModal.tsx': 'src/components/InvitationRulesModal.tsx',
    'ReferralShareCard.tsx': 'src/components/ReferralShareCard.tsx',
    'SubordinateDataModal.tsx': 'src/components/SubordinateDataModal.tsx',
    'TransactionDetailsModal.tsx': 'src/components/TransactionDetailsModal.tsx',
    'TransactionRequestForm.tsx': 'src/components/TransactionRequestForm.tsx',
    'GameMonitorPanel.tsx': 'src/components/admin/game-monitor/GameMonitorPanel.tsx',
    'Popular.tsx': 'src/pages/Popular.tsx',
}
fixed = 0
failures = []
for name, rel in MAP.items():
    path = os.path.join(RAW, name)
    if not os.path.isfile(path):
        failures.append({'path': rel, 'error': f'missing raw {name}'})
        continue
    with open(path, encoding='utf-8') as f:
        content = f.read()
    r = subprocess.run([sys.executable, WRITE, rel], input=content, text=True, capture_output=True)
    if r.returncode:
        failures.append({'path': rel, 'error': (r.stderr or r.stdout).strip()})
    else:
        fixed += 1
        print(r.stdout.strip())
print(json.dumps({'fixed': fixed, 'total': len(MAP), 'failures': failures}, indent=2))
sys.exit(0 if fixed == len(MAP) else 1)
