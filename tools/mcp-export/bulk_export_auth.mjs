#!/usr/bin/env node
/**
 * Bulk export pending src files via Lovable MCP with Cursor broker auth.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";
const PENDING = path.join(WORKSPACE, ".export-tmp/pending_all.json");
const MCP_URL = process.env.LOVABLE_MCP_URL || "https://mcp.lovable.dev/mcp";
const TOKEN = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN || "";
const CONCURRENCY = parseInt(process.env.EXPORT_CONCURRENCY || "6", 10);
const BATCH = parseInt(process.argv[2] || "25", 10);

function pendingSrc() {
  const data = JSON.parse(fs.readFileSync(PENDING, "utf8"));
  return (data.pending_src_paths || []).filter(
    (p) => !fs.existsSync(path.join(WORKSPACE, p))
  );
}

function writeFile(rel, content) {
  if (!content || content.startsWith("Lovable API error")) throw new Error("invalid content");
  const head = content.trimStart().slice(0, 20);
  if (rel.endsWith(".tsx") && (head.startsWith("@import") || head.startsWith("@tailwind"))) {
    throw new Error("corrupted tsx");
  }
  if (head.startsWith("{") && content.slice(0, 200).includes('"data"')) {
    throw new Error("json corruption");
  }
  const full = path.join(WORKSPACE, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.endsWith("\n") ? content : content + "\n", "utf8");
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
  const client = new Client({ name: "bulk-export-auth", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function readFile(client, filePath) {
  const res = await client.callTool({
    name: "read_file",
    arguments: { project_id: PROJECT_ID, path: filePath },
  });
  const text = res.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error("no content");
  return text;
}

async function main() {
  const paths = pendingSrc().slice(0, BATCH);
  console.log(JSON.stringify({ batch: paths.length, pending_before: pendingSrc().length }));
  if (paths.length === 0) {
    console.log(JSON.stringify({ written: 0, failed: 0, pending_after: 0 }));
    return;
  }

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
      if (!p) break;
      try {
        const content = await readFile(client, p);
        writeFile(p, content);
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

  const pendingAfter = pendingSrc().length;
  console.log(JSON.stringify({ written, failed: failures.length, failures, pending_after: pendingAfter }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
