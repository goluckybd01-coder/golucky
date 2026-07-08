#!/usr/bin/env python3
"""Parse vite build output for missing module resolution."""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path("/workspace")


def resolve_import(imp: str, from_file: str) -> str | None:
    base = (ROOT / from_file).parent
    if imp.startswith("@/"):
        target = ROOT / "src" / imp[2:]
    elif imp.startswith("./") or imp.startswith("../"):
        target = (base / imp).resolve()
    else:
        return None
    for ext in ("", ".ts", ".tsx", ".js", ".jsx", ".css"):
        p = Path(str(target) + ext)
        if p.is_file():
            return str(p.relative_to(ROOT))
    return str(target.relative_to(ROOT))


def main():
    proc = subprocess.run(
        ["npm", "run", "build"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    out = proc.stdout + proc.stderr
    print(out[-4000:])
    if proc.returncode == 0:
        print("BUILD_OK")
        return 0

    patterns = [
        r'Could not resolve "([^"]+)" from "([^"]+)"',
        r'ERROR: Could not resolve "([^"]+)"',
    ]
    for pat in patterns:
        m = re.search(pat, out)
        if m:
            imp = m.group(1)
            from_file = m.group(2) if m.lastindex and m.lastindex >= 2 else "src/main.tsx"
            resolved = resolve_import(imp, from_file)
            print(f"MISSING_IMPORT={imp}")
            print(f"FROM_FILE={from_file}")
            if resolved:
                print(f"RESOLVED_PATH={resolved}")
            return 1

    m2 = re.search(r"([^\\s]+\\.(?:tsx|ts|jsx|js)):\\d+:\\d+: ERROR:", out)
    if m2:
        print(f"SYNTAX_FILE={m2.group(1)}")
        return 1

    print("UNKNOWN_ERROR")
    return 1


if __name__ == "__main__":
    sys.exit(main())
