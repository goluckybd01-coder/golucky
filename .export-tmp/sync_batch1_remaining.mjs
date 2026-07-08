#!/usr/bin/env node
/**
 * Sync remaining batch1 files from Lovable MCP to /workspace.
 * Uses Cursor agent identity broker token for MCP auth.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "node:fs";
import path from "node:path";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const WORKSPACE = "/workspace";

const FILES = [
  "src/pages/admin/NewUsersPage.tsx",
  "src/pages/admin/PremiumDepositsPage.tsx",
  "src/pages/admin/PremiumWithdrawsPage.tsx",
  "src/pages/admin/BannersAdmin.tsx",
  "src/pages/admin/AnnouncementsAdmin.tsx",
  "src/pages/admin/SupportChatAdmin.tsx",
  "src/pages/admin/AgentCommissionAdmin.tsx",
  "src/pages/admin/DatabaseAdmin.tsx",
  "src/pages/admin/KycAdmin.tsx",
  "src/pages/admin/AdminCmsFoundationPage.tsx",
];

const token = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN;
if (!token) {
  console.error("Missing CURSOR_AGENT_IDENTITY_BROKER_TOKEN");
  process.exit(1);
}

const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.lovable.dev/mcp"),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  }
);

const client = new Client({ name: "batch1-sync", version: "1.0.0" });
await client.connect(transport);

const written = [];
const failed = [];

for (const filePath of FILES) {
  try {
    const result = await client.callTool({
      name: "read_file",
      arguments: { project_id: PROJECT_ID, path: filePath },
    });
    const content = result.content
      ?.map((c) => (c.type === "text" ? c.text : ""))
      .join("") ?? "";
    if (!content) throw new Error("Empty content");
    const dest = path.join(WORKSPACE, filePath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content.endsWith("\n") ? content : content + "\n", "utf8");
    written.push(filePath);
    console.log(`OK ${filePath} (${content.length} bytes)`);
  } catch (e) {
    failed.push({ path: filePath, error: String(e?.message || e) });
    console.error(`FAIL ${filePath}:`, e?.message || e);
  }
}

console.log(JSON.stringify({ written: written.length, failed, paths_written: written }, null, 2));
await client.close();
