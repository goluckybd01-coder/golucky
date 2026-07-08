#!/usr/bin/env node
/** Export batch32 paths via Lovable MCP HTTP + mcp_immediate_write.py (always overwrite). */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";
const PATHS_FILE = path.join(WORKSPACE, ".export-tmp/batch32_paths.json");
const WRITE_PY = path.join(WORKSPACE, "tools/mcp_immediate_write.py");
const MCP_URL = process.env.LOVABLE_MCP_URL || "https://mcp.lovable.dev/mcp";
const TOKEN = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN || "";
const CONCURRENCY = 6;

function allPaths() {
  return JSON.parse(fs.readFileSync(PATHS_FILE, "utf8"));
}

function writeViaTool(rel, content) {
  const r = spawnSync("python3", [WRITE_PY, rel], {
    input: content,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || "write failed").trim());
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
  const client = new Client({ name: "export-batch32", version: "1.0.0" });
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
  const paths = allPaths();
  console.log(JSON.stringify({ total: paths.length }));
  let client;
  try {
    client = await connect();
  } catch (e) {
    console.error("CONNECT_FAIL", e.message);
    process.exit(2);
  }
  let written = 0;
  const failures = [];
  const queue = [...paths];
  async function worker() {
    while (queue.length) {
      const p = queue.shift();
      if (!p) continue;
      try {
        const content = await readFile(client, p);
        writeViaTool(p, content);
        written++;
        console.log(`OK ${p} (${content.length})`);
      } catch (e) {
        failures.push({ path: p, error: e.message });
        console.error(`FAIL ${p}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await client.close().catch(() => {});
  console.log(JSON.stringify({ written, failed: failures.length, failures }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
