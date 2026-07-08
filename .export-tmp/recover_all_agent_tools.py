#!/usr/bin/env python3
"""Recover source files from agent-tools/*.txt MCP read_file responses."""
import os, re, json, glob, hashlib

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"
MANIFEST = "/workspace/.export-tmp/full_manifest.json"

# Known export default -> path mappings from file content signatures
SIGNATURES = [
    (r"export default AdminSidebar", "src/components/admin/AdminSidebar.tsx"),
    (r"export default AdminLayout", "src/components/admin/AdminLayout.tsx"),
    (r"export default NewAdminShell", "src/components/admin/NewAdminShell.tsx"),
    (r"export default AdminShell", "src/components/admin/AdminShell.tsx"),
    (r"export default AdminUniversalNav", "src/components/admin/AdminUniversalNav.tsx"),
    (r"export default AdminTotpGate", "src/components/admin/AdminTotpGate.tsx"),
    (r"export default LiveBetsPanel", "src/components/admin/LiveBetsPanel.tsx"),
    (r"export default LiveResultControl", "src/components/admin/LiveResultControl.tsx"),
    (r"export default TradeControlPanel", "src/components/admin/TradeControlPanel.tsx"),
    (r"export default EnhancedStatsCard", "src/components/admin/EnhancedStatsCard.tsx"),
    (r"export default AIAssistant", "src/components/AIAssistant.tsx"),
    (r"export default BottomNav", "src/components/BottomNav.tsx"),
    (r"export default MainLayout", "src/components/MainLayout.tsx"),
    (r"export default HomeSkeleton", "src/components/HomeSkeleton.tsx"),
    (r"export default FloatingSupport", "src/components/FloatingSupport.tsx"),
    (r"export default WinGo", "src/pages/games/WinGo.tsx"),
    (r"export default TrxWin", "src/pages/games/TrxWin.tsx"),
    (r"export default FiveD", "src/pages/games/FiveD.tsx"),
    (r"export default K3", "src/pages/games/K3.tsx"),
    (r"export default function Trading", "src/pages/Trading.tsx"),
    (r"export default AgentHighlightBanner", "src/components/AgentHighlightBanner.tsx"),
    (r"export default SuspenseReveal", "src/components/game/SuspenseReveal.tsx"),
    (r"export default AuthGuard", "src/components/AuthGuard.tsx"),
    (r"export default DemoModeBanner", "src/components/DemoModeBanner.tsx"),
    (r"export default Sparkline", "src/components/home/premium/Sparkline.tsx"),
    (r"const App = ", "src/App.tsx"),
    (r"createRoot\(", "src/main.tsx"),
]

def detect_path(content):
    if not content or len(content) < 50:
        return None
    if content.startswith("{") and '"pagination"' in content[:500]:
        return None
    if content.startswith('{"') and '"data"' in content[:300]:
        return None
    if "Lovable API error" in content[:100]:
        return None
    # Try import path hints
    m = re.search(r'^// filepath:\s*(.+)$', content, re.M)
    if m:
        return m.group(1).strip()
    for pattern, path in SIGNATURES:
        if re.search(pattern, content):
            return path
  # Heuristic: component name from first line
    m = re.match(r'^import .+ from ["\']', content)
    if not m and not content.startswith("import"):
        return None
    return None

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    os.makedirs(os.path.dirname(full) or WORKSPACE, exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")

def main():
    recovered = []
    skipped = []
    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(f, encoding="utf-8", errors="replace") as inf:
            content = inf.read().strip()
        path = detect_path(content)
        if not path:
            continue
        full = os.path.join(WORKSPACE, path)
        if os.path.exists(full):
            skipped.append(path)
            continue
        write_file(path, content)
        recovered.append(path)
        print(f"Recovered {path} ({len(content)} bytes)")
    print(json.dumps({"recovered": len(recovered), "paths": recovered, "skipped_existing": len(skipped)}))

if __name__ == "__main__":
    main()
