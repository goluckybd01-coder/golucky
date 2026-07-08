import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TARGETS = [
  { label: "HomeMobile", file: resolve(__dirname, "../pages/HomeMobile.tsx") },
  { label: "HomeDesktop", file: resolve(__dirname, "../pages/HomeDesktop.tsx") },
];

const START_MARKER = 'id="home-agent-empire"';
const END_MARKER = 'id="home-fixed-deposit"';

function extractSection02(source: string): string {
  const start = source.indexOf(START_MARKER);
  const end = source.indexOf(END_MARKER, start);
  if (start === -1 || end === -1) {
    throw new Error(
      "Section 02 markers not found — update START_MARKER/END_MARKER in this test."
    );
  }
  return source.slice(start, end);
}

const FORBIDDEN_PATTERNS: { name: string; re: RegExp }[] = [
  { name: "animate-pulse", re: /\banimate-pulse\b/ },
  { name: "animate-ping", re: /\banimate-ping\b/ },
  { name: "animate-bounce", re: /\banimate-bounce\b/ },
  { name: "animate-flash", re: /\banimate-flash\b/ },
  { name: "animate-glow", re: /\banimate-glow\b/i },
  { name: "animate-neon", re: /\banimate-neon\b/i },
  { name: "animate-shimmer", re: /\banimate-shimmer\b/i },
  { name: "animation: pulse", re: /animation:\s*["'`]?[^"'`;]*\bpulse\b/i },
  { name: "animation: ping", re: /animation:\s*["'`]?[^"'`;]*\bping\b/i },
  { name: "animation: flash", re: /animation:\s*["'`]?[^"'`;]*\bflash\b/i },
  { name: "animation: neon", re: /animation:\s*["'`]?[^"'`;]*\bneon\b/i },
  { name: "animation: glow", re: /animation:\s*["'`]?[^"'`;]*\bglow\b/i },
  { name: "@keyframes pulse", re: /@keyframes\s+\w*pulse\w*/i },
  { name: "@keyframes ping", re: /@keyframes\s+\w*ping\w*/i },
  { name: "@keyframes flash", re: /@keyframes\s+\w*flash\w*/i },
  { name: "@keyframes neon", re: /@keyframes\s+\w*neon\w*/i },
  { name: "@keyframes glow", re: /@keyframes\s+\w*glow\w*/i },
];

for (const { label, file } of TARGETS) {
  describe(`SECTION 02 (Agent Empire) — static luxury glow only [${label}]`, () => {
    const source = readFileSync(file, "utf8");
    const block = extractSection02(source);
    for (const { name, re } of FORBIDDEN_PATTERNS) {
      it(`must not contain \`${name}\``, () => {
        expect(
          re.test(block),
          `Forbidden motion pattern "${name}" found inside Section 02 of ${label}. SECTION 02 is locked to static luxury glows only.`
        ).toBe(false);
      });
    }
  });
}
