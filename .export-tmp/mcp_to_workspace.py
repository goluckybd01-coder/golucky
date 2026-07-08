#!/usr/bin/env python3
"""Write MCP content files from agent-tools or incoming staging to workspace."""
import glob
import json
import os
import re
import shutil
import sys

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
INCOMING = "/workspace/.export-tmp/incoming"
BATCH_FILE = "/workspace/.export-tmp/batch_2.json"

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


def match_content(content, pending):
    for sig, path in SIGNATURES.items():
        if path in pending and sig in content:
            return path
    m = re.search(r"export\s+default\s+(?:function\s+)?(\w+)", content)
    if m:
        candidate = f"src/pages/{m.group(1)}.tsx"
        if candidate in pending:
            return candidate
    return None


def flush_incoming(pending):
    results = {"written": 0, "skipped": 0, "matched": []}
    if not os.path.isdir(INCOMING):
        return results
    for root, _, files in os.walk(INCOMING):
        for name in files:
            src = os.path.join(root, name)
            rel = os.path.relpath(src, INCOMING)
            if rel not in pending:
                continue
            with open(src, encoding="utf-8", errors="replace") as f:
                content = f.read()
            status = write_file(rel, content)
            if status == "written":
                results["written"] += 1
            else:
                results["skipped"] += 1
            results["matched"].append({"path": rel, "status": status, "source": "incoming"})
            pending.discard(rel)
    return results


def flush_agent_tools(pending):
    results = {"written": 0, "skipped": 0, "matched": []}
    seen = set()
    for tf in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(tf, encoding="utf-8", errors="replace") as f:
            content = f.read().strip()
        if not content or content in seen or len(content) < 50:
            continue
        if content.startswith("{") and '"pagination"' in content[:500]:
            continue
        seen.add(content)
        matched = match_content(content, pending)
        if not matched:
            continue
        status = write_file(matched, content)
        if status == "written":
            results["written"] += 1
        else:
            results["skipped"] += 1
        results["matched"].append({"path": matched, "status": status, "source": os.path.basename(tf)})
        pending.discard(matched)
    return results


def flush_map():
    map_file = "/workspace/.export-tmp/mcp_batch2_map.json"
    if not os.path.isfile(map_file):
        return {"written": 0, "skipped": 0, "failed": 0}
    data = json.load(open(map_file))
    from export_batch2_worker import write_map
    return write_map(data)


def main():
    batch = load_batch()
    pending = {p for p in batch if not os.path.isfile(os.path.join(WORKSPACE, p))}
    r1 = flush_incoming(pending)
    r2 = flush_agent_tools(pending)
    total_written = r1["written"] + r2["written"]
    total_skipped = r1["skipped"] + r2["skipped"]
    out = {
        "written": total_written,
        "skipped": total_skipped,
        "matched": r1["matched"] + r2["matched"],
        "pending": len(pending),
    }
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    os.chdir("/workspace/.export-tmp")
    sys.path.insert(0, "/workspace/.export-tmp")
    main()
