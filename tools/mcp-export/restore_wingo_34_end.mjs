#!/usr/bin/env node
/** Restore wingo_corrupted.json indices 34-end via Lovable MCP + mcp_immediate_write.py */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";
const PATHS_FILE = path.join(WORKSPACE, ".export-tmp/wingo_corrupted.json");
const WRITE_PY = path.join(WORKSPACE, "tools/mcp_immediate_write.py");
const MCP_URL = process.env.LOVABLE_MCP_URL || "https://mcp.lovable.dev/mcp";
const TOKEN = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN || "";
const CORRUPTED = 'import PageScaffold from "@/components/templates/PageScaffold"';
const LEGIT = new Set([
  "src/components/templates/ExamplePage.tsx",
  "src/pages/games/AviatorGame.tsx",
  "src/pages/games/VideoWinGo.tsx",
  "src/pages/games/MotoRace.tsx",
  "src/pages/games/K3.tsx",
  "src/pages/games/FiveD.tsx",
  "src/pages/games/TrxWin.tsx",
  "src/pages/games/MinesGame.tsx",
  "src/pages/games/CrashGame.tsx",
]);

function loadPaths() {
  const lines = fs.readFileSync(PATHS_FILE, "utf8").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const start = lines[0]?.match(/^\d+$/) ? 1 : 0;
  const paths = [];
  for (const ln of lines.slice(start)) {
    const t = ln.replace(/,$/, "").trim();
    if (t === "[" || t === "]") continue;
    if (t.startsWith('"')) paths.push(JSON.parse(t));
  }
  return paths.slice(34);
}

function writeViaTool(rel, content) {
  const r = spawnSync("python3", [WRITE_PY, rel], {
    input: content,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "write failed").trim());
}

function verify(rel) {
  const full = path.join(WORKSPACE, rel);
  const head = fs.readFileSync(full, "utf8").slice(0, 500);
  if (LEGIT.has(rel)) return head.includes("PageScaffold");
  return !head.includes(CORRUPTED);
}

async function connect() {
  const headers = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  if (TOKEN) {
    headers.Authorization = `Bearer ${TOKEN}`;
    headers["X-Cursor-Agent"] = "1";
  }
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers },
  });
  const client = new Client({ name: "restore-wingo-34", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function readFile(client, filePath) {
  const res = await client.callTool({
    name: "read_file",
    arguments: { project_id: PROJECT_ID, path: filePath },
  });
  const text = res.content?.find((c) => c.type === "text")?.text;
  if (!text || text.startsWith("Lovable API error")) throw new Error(text || "no content");
  return text;
}

async function main() {
  const paths = loadPaths();
  let client;
  try {
    client = await connect();
  } catch (e) {
    console.error("CONNECT_FAIL", e.message);
    process.exit(2);
  }
  let fixed = 0;
  const failures = [];
  for (const p of paths) {
    try {
      const content = await readFile(client, p);
      writeViaTool(p, content);
      if (verify(p)) {
        fixed++;
        console.log(`OK ${p}`);
      } else {
        failures.push({ path: p, error: "verify failed" });
        console.error(`VERIFY_FAIL ${p}`);
      }
    } catch (e) {
      failures.push({ path: p, error: e.message });
      console.error(`FAIL ${p}: ${e.message}`);
    }
  }
  await client.close();
  console.log(JSON.stringify({ fixed, total: paths.length, failures }, null, 2));
  process.exit(fixed === paths.length ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
