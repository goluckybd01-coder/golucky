#!/usr/bin/env python3
"""Write pending batch_2 files by matching unique content signatures."""
import glob
import json
import os
import re

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"

# Unique substring -> path (first match wins)
SIGNATURES = {
    "export function useAviatorLiveSync": "src/hooks/useAviatorLiveSync.ts",
    "export const useAviatorSounds": "src/hooks/useAviatorSounds.ts",
    "export function useCrashRoundSync": "src/hooks/useCrashRoundSync.ts",
    "export const useCrashSounds": "src/hooks/useCrashSounds.ts",
    "export function useGameMode": "src/hooks/useGameMode.ts",
    "export const useMinesGame": "src/hooks/useMinesGame.ts",
    "export const useMinesSounds": "src/hooks/useMinesSounds.ts",
    "export const usePredictionSounds": "src/hooks/usePredictionSounds.ts",
    "export const usePremiumGameSounds": "src/hooks/usePremiumGameSounds.ts",
    "export const usePushNotifications": "src/hooks/usePushNotifications.ts",
    "export const useSupportChat": "src/hooks/useSupportChat.ts",
    "fetchAllAchievements": "src/lib/achievementService.ts",
    "adminLogin(payload": "src/lib/adminApi.ts",
    "fetchCashbackSettings": "src/lib/cashbackService.ts",
    "fetchChallenges = async": "src/lib/challengeService.ts",
    "STREAK_REWARDS = [5": "src/lib/dailyRewardService.ts",
    "export const gameStore": "src/lib/gameStore.ts",
    "generateMinePositionsProvablyFair": "src/lib/minesEngine.ts",
    "createDepositRequest = async": "src/lib/mobilePaymentService.ts",
    "sendVIPUpgradeNotification": "src/lib/pushNotificationService.ts",
    "export function settleRound": "src/lib/roundSettlement.ts",
    "creditRewardSecure": "src/lib/secureRewardService.ts",
    "Super Admin startup integrity": "src/lib/superAdminCheck.test.ts",
    "fetchTournamentLeaderboard": "src/lib/tournamentService.ts",
    "buildTradesCSV": "src/lib/tradeExport.test.ts",
    "deductBetDB = async": "src/lib/walletService.ts",
    "Hardened RLS write restrictions": "src/lib/__tests__/rlsWriteRestrictions.integration.test.ts",
    "security-comment-urls": "src/lib/__tests__/security-comment-urls.test.ts",
    "Normal user profile RLS": "src/lib/__tests__/userProfileRls.integration.test.ts",
}


def load_batch():
    return json.load(open(BATCH_FILE))


def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.isfile(full):
        return "skipped"
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return "written"


def match_by_signature(content, pending_set):
    for sig, path in SIGNATURES.items():
        if path not in pending_set:
            continue
        if sig in content:
            return path
    return None


def match_page(content, pending_pages):
    m = re.search(r"export\s+default\s+(?:function\s+)?(\w+)", content)
    if not m:
        return None
    name = m.group(1)
    candidate = f"src/pages/{name}.tsx"
    if candidate in pending_pages:
        return candidate
    return None


def main():
    batch = load_batch()
    pending = {p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))}
    pending_pages = {p for p in pending if p.startswith("src/pages/")}
    results = {"written": 0, "skipped": 0, "matched": []}
    seen = set()

    sources = sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True)
    for tf in sources:
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or content in seen or len(content) < 50:
            continue
        if content.startswith("{") and '"pagination"' in content[:500]:
            continue
        seen.add(content)

        matched = match_by_signature(content, pending)
        if not matched:
            matched = match_page(content, pending_pages)
        if not matched:
            continue

        status = write_file(matched, content)
        if status == "written":
            results["written"] += 1
        else:
            results["skipped"] += 1
        results["matched"].append({"path": matched, "status": status})
        pending.discard(matched)

    results["pending"] = len(pending)
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
