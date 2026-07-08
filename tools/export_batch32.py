#!/usr/bin/env python3
"""Fetch batch32 paths from Lovable MCP and write via mcp_immediate_write.py (always overwrite)."""
import asyncio
import json
import os
import subprocess
import sys

try:
    import websockets
except ImportError:
    os.system(f"{sys.executable} -m pip install -q websockets")
    import websockets

PROJECT = "a96058c7-1b97-4e98-a71b-6b6121d46efa"
WORKSPACE = "/workspace"
MCP_URL = os.environ.get("CURSOR_MCP_WS", "ws://127.0.0.1:26054/mcp")
WRITE = os.path.join(WORKSPACE, "tools", "mcp_immediate_write.py")

PATHS = [
    "src/components/admin/unified/GamesCatalogModule.tsx",
    "src/components/admin/unified/StaffManagement.tsx",
    "src/components/admin/unified/UsersModule.tsx",
    "src/components/admin/unified/WithdrawRequestsModule.tsx",
    "src/components/agent/USDTPaymentGateway.tsx",
    "src/components/aviator/AviatorLiveBets.tsx",
    "src/components/aviator/AviatorStreakBonus.tsx",
    "src/components/deposit/USDTDepositFlow.tsx",
    "src/components/game/CrashSessionTracker.tsx",
    "src/components/game/CrashSoundSettings.tsx",
    "src/components/game/GlobalResultModal.tsx",
    "src/components/game/K3DiceBoard.tsx",
    "src/components/game/LiveBetsFeed.tsx",
    "src/components/game/LivePlayersList.tsx",
    "src/components/game/ProvablyFairDisplay.tsx",
    "src/components/games/PopularAndProviders.tsx",
    "src/components/home/DemoGamesSection.tsx",
    "src/components/home/LiveEarningsChart.tsx",
    "src/components/home/LiveSuperJackpot.tsx",
    "src/components/home/LiveTopEarners.tsx",
    "src/components/home/LiveWinningInfo.tsx",
    "src/components/home/LiveWinningStats.tsx",
    "src/components/home/PopularGamesSection.tsx",
    "src/components/home/PremiumBalanceCard.tsx",
    "src/components/home/PremiumHeader.tsx",
    "src/components/home/ProviderGamesSection.tsx",
    "src/components/home/TodayEarningChart.tsx",
    "src/components/home/WinnersMarquee.tsx",
    "src/components/profile/AvatarUpload.tsx",
    "src/components/ui/toaster.tsx",
    "src/components/ui/sonner.tsx",
    "src/components/ui/tooltip.tsx",
]


def write_one(rel: str, content: str) -> tuple[bool, str]:
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    ok = r.returncode == 0
    msg = (r.stdout or r.stderr).strip()
    return ok, msg


async def mcp_call(ws, name, arguments, req_id):
    msg = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {"name": name, "arguments": arguments},
    }
    await ws.send(json.dumps(msg))
    while True:
        raw = await asyncio.wait_for(ws.recv(), timeout=180)
        data = json.loads(raw)
        if data.get("id") == req_id:
            if "error" in data:
                raise RuntimeError(data["error"])
            result = data.get("result", {})
            for c in result.get("content", []):
                if c.get("type") == "text":
                    return c["text"]
            raise RuntimeError("no text content")


async def export_all(paths):
    written = failed = 0
    failures = []
    headers = []
    token = os.environ.get("CURSOR_AGENT_IDENTITY_BROKER_TOKEN", "")
    if token:
        headers = [("Authorization", f"Bearer {token}"), ("X-Cursor-Agent", "1")]
    async with websockets.connect(MCP_URL, subprotocols=["mcp"], additional_headers=headers) as ws:
        rid = 1
        for path in paths:
            try:
                content = await mcp_call(
                    ws,
                    "read_file",
                    {"project_id": PROJECT, "path": path},
                    rid,
                )
                rid += 1
                if not content or content.startswith("Lovable API error"):
                    raise RuntimeError(content or "empty")
                ok, msg = write_one(path, content)
                if ok:
                    written += 1
                    print(msg, flush=True)
                else:
                    failed += 1
                    failures.append({"path": path, "error": msg})
            except Exception as e:
                failed += 1
                failures.append({"path": path, "error": str(e)})
                print(f"FAIL {path}: {e}", flush=True)
    return {"written": written, "failed": failed, "failures": failures}


def main():
    result = asyncio.run(export_all(PATHS))
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
