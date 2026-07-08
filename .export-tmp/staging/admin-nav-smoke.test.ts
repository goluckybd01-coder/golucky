import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Admin navigation smoke test.
 *
 * Static guard that fails the build if any sidebar link in AdminShell
 * points at a path that isn't registered in App.tsx — the #1 cause of
 * runtime 404s inside the admin panel. Runs in CI via `vitest run`.
 */

const readSrc = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");

function extractNavPaths(shell: string): string[] {
  const paths: string[] = [];
  const re = /path:\s*['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(shell)) !== null) paths.push(m[1]);
  return paths;
}

function extractAdminRoutes(app: string): Set<string> {
  const routes = new Set<string>(["/admin"]);
  // Grab the block between the /admin parent Route open and its close.
  const start = app.indexOf('<Route path="/admin"');
  const end = app.indexOf("</Route>", start);
  const block = app.slice(start, end);
  const re = /<Route\s+(?:index|path=["']([^"']+)["'])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    if (m[0].includes("index")) routes.add("/admin");
    else routes.add(`/admin/${m[1]}`);
  }
  // /game-admin lives outside the /admin subtree.
  if (app.includes('path="/game-admin"')) routes.add("/game-admin");
  return routes;
}

describe("admin navigation smoke", () => {
  const shell = readSrc("src/components/admin/AdminShell.tsx");
  const app = readSrc("src/App.tsx");
  const navPaths = extractNavPaths(shell);
  const routes = extractAdminRoutes(app);

  it("sidebar exposes at least the core modules", () => {
    for (const required of [
      "/admin/dashboard",
      "/admin/users",
      "/admin/agents",
      "/admin/deposits",
      "/admin/withdraws",
      "/admin/wallet-ledger",
      "/admin/transactions",
      "/admin/financial",
      "/admin/promotions",
      "/admin/banners",
      "/admin/announcements",
      "/admin/support",
      "/admin/settings",
      "/admin/security",
      "/admin/admin-users",
      "/admin/roles",
      "/admin/audit-logs",
      "/admin/database",
      "/game-admin",
    ]) {
      expect(navPaths, `missing sidebar link: ${required}`).toContain(required);
    }
  });

  it.each(
    // Filter to admin/game-admin nav entries only.
    (function () {
      const shellSrc = readSrc("src/components/admin/AdminShell.tsx");
      return extractNavPaths(shellSrc).filter(
        (p) => p.startsWith("/admin") || p === "/game-admin"
      );
    })()
  )("route %s is registered in App.tsx (no 404)", (path) => {
    expect(routes.has(path), `no <Route> matches sidebar path ${path}`).toBe(
      true
    );
  });
});
