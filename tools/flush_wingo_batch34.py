#!/usr/bin/env python3
"""Flush wingo indices 34-end: read sources and write via mcp_immediate_write.py."""
import os
import subprocess
import sys

WORKSPACE = "/workspace"
WRITE = os.path.join(WORKSPACE, "tools/mcp_immediate_write.py")
AGENT_TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

# rel_path -> absolute source file
SOURCES = {
    "src/components/game/BetSummaryModal.tsx": os.path.join(AGENT_TOOLS, "batch34_BetSummaryModal.tsx"),
    "src/components/game/CashoutConfetti.tsx": os.path.join(AGENT_TOOLS, "batch34_CashoutConfetti.tsx"),
    "src/components/game/BetPanelContent.tsx": os.path.join(AGENT_TOOLS, "batch34_BetPanelContent.tsx"),
    "src/components/game/AIPredictionHistory.tsx": os.path.join(AGENT_TOOLS, "batch34_AIPredictionHistory.tsx"),
    "src/components/game/BetSheet.tsx": os.path.join(AGENT_TOOLS, "batch34_BetSheet.tsx"),
    "src/components/game/CrashAutoBet.tsx": os.path.join(AGENT_TOOLS, "batch34_CrashAutoBet.tsx"),
    "src/components/game/ResultModal.tsx": os.path.join(AGENT_TOOLS, "batch34_ResultModal.tsx"),
    "src/components/game/BetHistoryChart.tsx": os.path.join(AGENT_TOOLS, "batch34_BetHistoryChart.tsx"),
    "src/components/templates/ExamplePage.tsx": os.path.join(AGENT_TOOLS, "batch34_ExamplePage.tsx"),
    "src/pages/games/AviatorGame.tsx": os.path.join(AGENT_TOOLS, "ff38265e-d159-4984-ba05-6ff459f71ce8.txt"),
    "src/pages/games/VideoWinGo.tsx": os.path.join(AGENT_TOOLS, "batch34_VideoWinGo.tsx"),
    "src/pages/games/MotoRace.tsx": os.path.join(AGENT_TOOLS, "batch34_MotoRace.tsx"),
    "src/pages/games/K3.tsx": os.path.join(AGENT_TOOLS, "1713929c-a8dc-448a-a45a-e4edcdefcdb4.txt"),
    "src/pages/games/FiveD.tsx": os.path.join(AGENT_TOOLS, "d7192dd9-7ea9-43f8-838a-ac7ac18eeb41.txt"),
    "src/pages/games/TrxWin.tsx": os.path.join(AGENT_TOOLS, "f62732e7-8fe0-47b0-b3bd-48f7a280445f.txt"),
    "src/pages/games/MinesGame.tsx": os.path.join(AGENT_TOOLS, "batch34_MinesGame.tsx"),
    "src/pages/games/CrashGame.tsx": os.path.join(AGENT_TOOLS, "a78fa909-f0e6-4856-8ecb-b344b35a1b79.txt"),
    "src/pages/games/useWingoResultBanner.test.tsx": os.path.join(AGENT_TOOLS, "batch34_useWingoResultBanner.test.tsx"),
}

CORRUPTED_HEAD = 'import PageScaffold from "@/components/templates/PageScaffold"'
LEGIT = {
    "src/components/templates/ExamplePage.tsx",
    "src/pages/games/AviatorGame.tsx",
    "src/pages/games/VideoWinGo.tsx",
    "src/pages/games/MotoRace.tsx",
    "src/pages/games/K3.tsx",
    "src/pages/games/FiveD.tsx",
    "src/pages/games/TrxWin.tsx",
    "src/pages/games/MinesGame.tsx",
    "src/pages/games/CrashGame.tsx",
}


def verify(rel: str) -> bool:
    full = os.path.join(WORKSPACE, rel)
    with open(full, encoding="utf-8") as f:
        head = f.read(500)
    if rel in LEGIT:
        return "PageScaffold" in head
    return CORRUPTED_HEAD not in head


def write_one(rel: str, src: str) -> None:
    with open(src, encoding="utf-8") as f:
        content = f.read()
    r = subprocess.run(
        [sys.executable, WRITE, rel],
        input=content,
        text=True,
        capture_output=True,
    )
    if r.returncode:
        raise RuntimeError(f"{rel}: {(r.stderr or r.stdout).strip()}")


def main():
    fixed = 0
    errors = []
    for rel, src in SOURCES.items():
        if not os.path.isfile(src):
            errors.append(f"missing source: {src}")
            continue
        try:
            write_one(rel, src)
            if verify(rel):
                fixed += 1
                print(f"OK {rel}")
            else:
                errors.append(f"verify failed: {rel}")
        except Exception as e:
            errors.append(f"{rel}: {e}")
    print(f"FIXED={fixed}/{len(SOURCES)}")
    if errors:
        for e in errors:
            print(f"ERR {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
