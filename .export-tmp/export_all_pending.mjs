#!/usr/bin/env node
/**
 * Export all pending text files from Lovable manifest via MCP read_file.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";
const MANIFEST = path.join(WORKSPACE, ".export-tmp/manifest.json");
const STATUS = path.join(WORKSPACE, ".export-tmp/EXPORT_STATUS.json");
const BATCH_SIZE = 18;
const CONCURRENCY = 6;

function priority(p) {
  if (p === "src/App.tsx" || p === "src/main.tsx") return [0, p];
  if (p.startsWith("src/components/")) return [1, p];
  if (p.startsWith("src/pages/")) return [2, p];
  if (p.startsWith("src/context/")) return [3, p];
  if (p.startsWith("src/lib/")) return [4, p];
  if (p.startsWith("supabase/migrations/")) return [5, p];
  if (p.startsWith("tests/")) return [6, p];
  if (p.startsWith("docs/")) return [7, p];
  if (p.startsWith(".github/workflows/")) return [8, p];
  return [9, p];
}

function writeFile(rel, content) {
  const full = path.join(WORKSPACE, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const out = content.endsWith("\n") ? content : content + "\n";
  fs.writeFileSync(full, out, "utf8");
}

async function connect() {
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.lovable.dev/mcp"), {
    requestInit: { headers: {} },
  });
  const client = new Client({ name: "export-pending", version: "1.0.0" });
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

async function exportBatch(client, paths) {
  let exported = 0;
  const failures = [];
  const queue = [...paths];

  async function worker() {
    while (queue.length) {
      const p = queue.shift();
      if (!p) break;
      if (fs.existsSync(path.join(WORKSPACE, p))) continue;
      try {
        const content = await readFile(client, p);
        writeFile(p, content);
        exported++;
        if (exported % 25 === 0) console.log(`  exported ${exported} in batch...`);
      } catch (e) {
        failures.push({ path: p, error: e.message });
        console.error(`FAIL ${p}: ${e.message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return { exported, failures };
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
  let pending = manifest.text_files.filter((p) => !fs.existsSync(path.join(WORKSPACE, p)));
  pending.sort((a, b) => {
    const pa = priority(a);
    const pb = priority(b);
    return pa[0] - pb[0] || pa[1].localeCompare(pb[1]);
  });

  console.log(`Pending: ${pending.length}`);
  const client = await connect();

  let totalExported = 0;
  const allFailures = [];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const round = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`\nBatch ${round}: ${batch.length} files`);
    const { exported, failures } = await exportBatch(client, batch);
    totalExported += exported;
    allFailures.push(...failures);
    console.log(`  done: +${exported}, failures: ${failures.length}`);
  }

  await client.close();

  const stillMissing = manifest.text_files.filter((p) => !fs.existsSync(path.join(WORKSPACE, p)));
  const status = {
    project_id: PROJECT_ID,
    total_files_listed: 2012,
    pagination_pages: 21,
    package_json_exists: fs.existsSync(path.join(WORKSPACE, "package.json")),
    exported_file_count: totalExported,
    total_exported_this_run: totalExported,
    failures: allFailures,
    pending_text_files: stillMissing.length,
    skipped_binary_note:
      "Skipped ~450 binary files (images, webp game logos, snapshots, bun.lockb, favicon, etc.)",
  };
  fs.writeFileSync(STATUS, JSON.stringify(status, null, 2));
  console.log("\n=== FINAL ===");
  console.log(JSON.stringify({ totalExported, failures: allFailures.length, stillMissing: stillMissing.length }, null, 2));
  if (stillMissing.length > 0 && stillMissing.length <= 30) {
    console.log("Still missing:", stillMissing);
  } else if (stillMissing.length > 30) {
    console.log("Still missing (first 30):", stillMissing.slice(0, 30));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
