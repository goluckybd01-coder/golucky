#!/usr/bin/env python3
"""
Recover MCP read_file responses from agent-tools/*.txt and write to workspace.
Detects path from export default / component name patterns.
"""
import os, re, json, glob

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

def detect_path(content, filename):
    # Try filename hints
    if "AdminSidebar" in content[:500]:
        return "src/components/admin/AdminSidebar.tsx"
    if "AdminLayout" in content[:300] and "AdminLayout" in content:
        if "export default AdminLayout" in content:
            return "src/components/admin/AdminLayout.tsx"
    if "export default AdminShell" in content or "export const AdminShell" in content:
        if "NewAdminShell" not in content[:200]:
            return "src/components/admin/AdminShell.tsx"
    if "export default NewAdminShell" in content or "export const NewAdminShell" in content:
        return "src/components/admin/NewAdminShell.tsx"
    if "AdminUniversalNav" in content:
        return "src/components/admin/AdminUniversalNav.tsx"
    if "AdminTotpGate" in content:
        return "src/components/admin/AdminTotpGate.tsx"
    if "LiveBetsPanel" in content and "export default LiveBetsPanel" in content:
        return "src/components/admin/LiveBetsPanel.tsx"
    if "LiveResultControl" in content and "export default LiveResultControl" in content:
        return "src/components/admin/LiveResultControl.tsx"
    if "TradeControlPanel" in content:
        return "src/components/admin/TradeControlPanel.tsx"
    if "EnhancedStatsCard" in content:
        return "src/components/admin/EnhancedStatsCard.tsx"
    if "export default AIAssistant" in content:
        return "src/components/AIAssistant.tsx"
    if "export default BottomNav" in content:
        return "src/components/BottomNav.tsx"
    if "export default MainLayout" in content:
        return "src/components/MainLayout.tsx"
    if "export default HomeSkeleton" in content:
        return "src/components/HomeSkeleton.tsx"
    if "export default FloatingSupport" in content:
        return "src/components/FloatingSupport.tsx"
    return None

def write_file(path, content):
    full = os.path.join(WORKSPACE, path)
    if os.path.exists(full):
        return False
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)
        if content and not content.endswith("\n"):
            f.write("\n")
    return True

def main():
    recovered = []
    skipped = []
    for f in sorted(glob.glob(os.path.join(TOOLS, "*.txt")), key=os.path.getmtime, reverse=True):
        with open(f, encoding="utf-8", errors="replace") as inf:
            content = inf.read().strip()
        if not content or content.startswith("{") and '"data"' in content[:300]:
            continue
        if content.startswith('{"') and '"pagination"' in content[:500]:
            continue
        path = detect_path(content, os.path.basename(f))
        if path and write_file(path, content):
            recovered.append(path)
            print(f"Recovered {path}")
        elif path:
            skipped.append(path)
    print(json.dumps({"recovered": len(recovered), "paths": recovered, "skipped_existing": skipped}))

if __name__ == "__main__":
    main()
