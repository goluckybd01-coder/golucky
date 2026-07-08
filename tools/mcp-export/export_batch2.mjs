#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";
const TOKEN = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN || "";

const FILES = [
  "src/pages/admin/AdminApiGameControlsPage.tsx",
  "src/pages/admin/AdminAiBuilderPage.tsx",
  "src/pages/admin/AdminUniversalCmsPage.tsx",
  "src/pages/admin/AdminAutomationCenterPage.tsx",
  "src/pages/admin/AdminDepositControlPage.tsx",
  "src/pages/admin/AdminDepositCentrePage.tsx",
  "src/pages/admin/SuperAdminControlPage.tsx",
  "src/pages/admin/AdminLoginPage.tsx",
  "src/pages/admin/MarketPricesDebug.tsx",
  "src/pages/admin/SuperAdminPage.tsx",
  "src/pages/admin/SecurityFixCenter.tsx",
  "src/pages/admin/SecurityCenter.tsx",
  "src/pages/admin/PromotionCenter.tsx",
  "src/pages/admin/GoogleSearchConsoleSetup.tsx",
  "src/pages/admin/DualWalletOverview.tsx",
  "src/pages/admin/UsdtDepositsAdmin.tsx",
  "src/pages/admin/UsdtRateAdmin.tsx",
  "src/pages/admin/FdAdminDashboard.tsx",
];

function writeFile(rel, content) {
  const full = path.join(WORKSPACE, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.endsWith("\n") ? content : content + "\n", "utf8");
}

async function connect() {
  const headers = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    Authorization: `Bearer ${TOKEN}`,
    "X-Cursor-Agent": "1",
  };
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.lovable.dev/mcp"), {
    requestInit: { headers },
  });
  const client = new Client({ name: "export-batch2", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function main() {
  const client = await connect();
  const written = [];
  const failed = [];

  for (const filePath of FILES) {
    try {
      const res = await client.callTool({
        name: "read_file",
        arguments: { project_id: PROJECT_ID, path: filePath },
      });
      const content = res.content?.find((c) => c.type === "text")?.text;
      if (!content) throw new Error("no content");
      writeFile(filePath, content);
      written.push(filePath);
      console.log(`OK ${filePath}`);
    } catch (e) {
      failed.push({ path: filePath, error: e.message });
      console.error(`FAIL ${filePath}: ${e.message}`);
    }
  }

  await client.close().catch(() => {});
  console.log(JSON.stringify({ written: written.length, failed, paths_written: written }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
