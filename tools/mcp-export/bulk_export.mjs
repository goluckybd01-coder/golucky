#!/usr/bin/env node
/**
 * Bulk export files from Lovable via MCP JSON-RPC.
 * Uses Cursor's injected MCP session when available.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";
const REF = "9cc0a40bac6c3843550ef2d7e7c27d0bfca3d67c";
const PAGES_DIR = "/workspace/.export-tmp/pages";
const BINARY_EXT = new Set([".png",".jpg",".jpeg",".gif",".webp",".ico",".svg",".zip",".lockb",".jfif",".mp4",".webm",".mp3",".pdf",".bin"]);

function isBinary(p, flagged) {
  if (flagged || path.basename(p) === "bun.lockb") return true;
  return BINARY_EXT.has(path.extname(p).toLowerCase());
}

function writeFile(rel, content) {
  const full = path.join(WORKSPACE, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.endsWith("\n") ? content : content + "\n", "utf8");
}

async function connect() {
  const headers = {};
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.lovable.dev/mcp"), {
    requestInit: { headers },
  });
  const client = new Client({ name: "bulk-export", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function paginateAll(client) {
  fs.mkdirSync(PAGES_DIR, { recursive: true });
  let cursor;
  let page = 1;
  while (true) {
    const args = { project_id: PROJECT_ID, limit: 100, ref: REF };
    if (cursor) args.cursor = cursor;
    const res = await client.callTool({ name: "list_files", arguments: args });
    const text = res.content?.find(c => c.type === "text")?.text;
    const data = JSON.parse(text);
    const out = { data: data.data, pagination: data.pagination };
    fs.writeFileSync(path.join(PAGES_DIR, `page_${String(page).padStart(3,"0")}.json`), JSON.stringify(out));
    console.log(`Page ${page}: ${data.data.length} files, has_more=${data.pagination?.has_more}`);
    if (!data.pagination?.has_more) break;
    cursor = data.pagination.next_cursor;
    page++;
  }
}

async function collectSrcPaths() {
  const paths = new Set();
  for (const f of fs.readdirSync(PAGES_DIR).filter(x => x.endsWith(".json")).sort()) {
    const page = JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8"));
    for (const item of page.data) {
      if (item.path.startsWith("src/") && !isBinary(item.path, item.binary)) paths.add(item.path);
    }
  }
  return [...paths].sort();
}

async function exportFiles(client, paths, concurrency = 8) {
  let done = 0, failed = 0;
  const queue = [...paths];
  async function worker() {
    while (queue.length) {
      const p = queue.shift();
      if (!p) break;
      const full = path.join(WORKSPACE, p);
      if (fs.existsSync(full)) { done++; continue; }
      try {
        const res = await client.callTool({
          name: "read_file",
          arguments: { project_id: PROJECT_ID, path: p, ref: REF },
        });
        const content = res.content?.find(c => c.type === "text")?.text;
        if (!content) throw new Error("no content");
        writeFile(p, content);
        done++;
        if (done % 25 === 0) console.log(`Exported ${done}/${paths.length}`);
      } catch (e) {
        failed++;
        console.error(`FAIL ${p}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return { done, failed };
}

async function main() {
  const cmd = process.argv[2] || "all";
  const client = await connect();
  if (cmd === "paginate" || cmd === "all") await paginateAll(client);
  const paths = await collectSrcPaths();
  console.log(`Src text files: ${paths.length}`);
  const pending = paths.filter(p => !fs.existsSync(path.join(WORKSPACE, p)));
  console.log(`Pending: ${pending.length}`);
  if (cmd === "export" || cmd === "all") {
    const r = await exportFiles(client, pending);
    console.log(JSON.stringify(r));
  }
  await client.close();
}

main().catch(e => { console.error(e); process.exit(1); });
