#!/usr/bin/env python3
"""Recover source files from agent-tools/*.txt MCP read_file responses."""
import json, os, glob, re, hashlib

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"

SIGNATURES = [
    (r"export type Json =", "src/integrations/supabase/types.ts"),
    (r"export default AdminSidebar", "src/components/admin/AdminSidebar.tsx"),
    (r"export default MainLayout", "src/components/MainLayout.tsx"),
    (r"export default BottomNav", "src/components/BottomNav.tsx"),
    (r"export default AIAssistant", "src/components/AIAssistant.tsx"),
    (r"export default FloatingSupport", "src/components/FloatingSupport.tsx"),
    (r"export default HomeSkeleton", "src/components/HomeSkeleton.tsx"),
    (r"export default MobileContainer", "src/components/MobileContainer.tsx"),
    (r"export default LoseDisplay", "src/components/LoseDisplay.tsx"),
    (r"export default InstallPromptBanner", "src/components/InstallPromptBanner.tsx"),
    (r"export default InvitationRulesModal", "src/components/InvitationRulesModal.tsx"),
    (r"export default GameDesktopRail", "src/components/GameDesktopRail.tsx"),
    (r"export default AddReferralCodeModal", "src/components/AddReferralCodeModal.tsx"),
    (r"export default BetPlacedAnimation", "src/components/BetPlacedAnimation.tsx"),
    (r"export default CoinRain", "src/components/CoinRain.tsx"),
    (r"export default CommissionDetailsModal", "src/components/CommissionDetailsModal.tsx"),
    (r"export default Confetti", "src/components/Confetti.tsx"),
    (r"export default DailyRewardModal", "src/components/DailyRewardModal.tsx"),
    (r"export default Fireworks", "src/components/Fireworks.tsx"),
    (r"export const FirstDepositBonusBanner", "src/components/FirstDepositBonusBanner.tsx"),
    (r"describe\(\"DemoModeBanner\"", "src/components/DemoModeBanner.test.tsx"),
    (r"describe\(\"GameErrorBoundary", "src/components/GameErrorBoundary.test.tsx"),
    (r"export default WinGo", "src/pages/games/WinGo.tsx"),
    (r"export default TrxWin", "src/pages/games/TrxWin.tsx"),
    (r"export default FiveD", "src/pages/games/FiveD.tsx"),
    (r"export default K3", "src/pages/games/K3.tsx"),
    (r"export default function Trading", "src/pages/Trading.tsx"),
    (r"export default SuspenseReveal", "src/components/game/SuspenseReveal.tsx"),
    (r"export default AuthGuard", "src/components/AuthGuard.tsx"),
    (r"export default DemoModeBanner", "src/components/DemoModeBanner.tsx"),
    (r"export default Sparkline", "src/components/home/premium/Sparkline.tsx"),
    (r"const App = ", "src/App.tsx"),
    (r"createRoot\(", "src/main.tsx"),
]

def pending():
    with open(MANIFEST) as f:
        m = json.load(f)
    src = m.get("src_text_files", [])
    return [p for p in src if not os.path.exists(os.path.join(WORKSPACE, p))]

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def detect_path(content, pen_set):
    if not content or len(content) < 50:
        return None
    if content.startswith("{") and ('"pagination"' in content[:500] or '"data"' in content[:300]):
        return None
    if "Lovable API error" in content[:100]:
        return None
    for pattern, path in SIGNATURES:
        if path in pen_set and re.search(pattern, content):
            return path
    m = re.search(r'export\s+default\s+(?:function\s+)?(\w+)', content)
    if m:
        name = m.group(1)
        candidates = [p for p in pen_set if p.endswith(f"/{name}.tsx") or p.endswith(f"/{name}.ts")]
        if len(candidates) == 1:
            return candidates[0]
        if len(candidates) > 1:
            return sorted(candidates, key=len)[0]
    m = re.search(r'export\s+const\s+(\w+)\s*=', content)
    if m:
        name = m.group(1)
        candidates = [p for p in pen_set if f"/{name}.tsx" in p or f"/{name}.ts" in p]
        if len(candidates) == 1:
            return candidates[0]
    return None

def main():
    pen = set(pending())
    recovered = []
    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt"))):
        with open(f, encoding="utf-8", errors="replace") as inf:
            c = inf.read().strip()
        path = detect_path(c, pen)
        if path:
            write_file(path, c)
            pen.discard(path)
            recovered.append(path)
    print(json.dumps({"recovered": len(recovered), "paths": recovered, "pending": len(pen)}))

if __name__ == "__main__":
    main()
