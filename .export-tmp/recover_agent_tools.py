#!/usr/bin/env python3
"""
Recover files from agent-tools/*.txt by detecting component/page names.
Maps known export defaults to file paths.
"""
import os, re, json, glob

WORKSPACE = "/workspace"
TOOLS = "/home/ubuntu/.cursor/projects/workspace/agent-tools"

MAPPINGS = [
    (r"export default WinGo", "src/pages/games/WinGo.tsx"),
    (r"export default TrxWin", "src/pages/games/TrxWin.tsx"),
    (r"export default FiveD", "src/pages/games/FiveD.tsx"),
    (r"export default K3", "src/pages/games/K3.tsx"),
    (r"export default function Trading", "src/pages/Trading.tsx"),
    (r"export default AgentHighlightBanner", "src/components/AgentHighlightBanner.tsx"),
    (r"@tailwind base", "src/index.css"),
    (r"export type Json =", "src/integrations/supabase/types.ts"),
    (r"# Welcome to your Lovable project", "README.md"),
]

def detect_path(content):
    for pattern, path in MAPPINGS:
        if re.search(pattern, content):
            return path
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
    for f in glob.glob(os.path.join(TOOLS, "*.txt")):
        with open(f, encoding="utf-8", errors="replace") as inf:
            content = inf.read()
        if content.startswith("{") and '"data"' in content[:200]:
            continue  # skip list_files JSON
        path = detect_path(content)
        if path and write_file(path, content):
            recovered.append(path)
            print(f"Recovered {path} from {os.path.basename(f)}")
    print(json.dumps({"recovered": len(recovered), "paths": recovered}))

if __name__ == "__main__":
    main()
