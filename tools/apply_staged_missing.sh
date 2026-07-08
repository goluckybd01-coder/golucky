#!/bin/bash
set -euo pipefail
STAGING="/workspace/.export-tmp/batch_missing_staging"
WRITE="/workspace/.export-tmp/mcp_stage_write.py"
PATHS=(
  "src/components/game/GlobalResultModal.tsx"
  "src/components/game/SuspenseReveal.tsx"
  "src/components/deposit/USDTDepositFlow.tsx"
  "src/components/aviator/AviatorLiveBets.tsx"
  "src/components/aviator/AviatorStreakBonus.tsx"
  "src/components/game/CrashSessionTracker.tsx"
  "src/components/game/CrashSoundSettings.tsx"
  "src/components/game/K3DiceBoard.tsx"
  "src/components/game/LiveBetsFeed.tsx"
  "src/components/game/LivePlayersList.tsx"
  "src/components/game/ProvablyFairDisplay.tsx"
  "src/components/admin/unified/StaffManagement.tsx"
  "src/components/admin/unified/UsersModule.tsx"
  "src/components/admin/unified/WithdrawRequestsModule.tsx"
  "src/hooks/useAudioManager.ts"
)
written=0
skipped=0
failed=0
for rel in "${PATHS[@]}"; do
  dest="/workspace/$rel"
  if [[ -f "$dest" && -s "$dest" ]]; then
    echo "SKIP existing $rel"
    ((skipped++)) || true
    continue
  fi
  stage="$STAGING/$(echo "$rel" | tr '/' '__')"
  if [[ ! -f "$stage" ]]; then
    echo "MISSING stage $rel"
    ((failed++)) || true
    continue
  fi
  if python3 "$WRITE" "$rel" < "$stage"; then
    ((written++)) || true
  else
    echo "FAIL $rel"
    ((failed++)) || true
  fi
done
echo "SUMMARY written=$written skipped=$skipped failed=$failed"
