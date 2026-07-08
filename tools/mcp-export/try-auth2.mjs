#!/usr/bin/env node
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import fs from "fs";
import path from "path";

const PROJECT_ID = "a96058c7-1b97-4e98-a71b-6b6121d46efa";
const PAGES_DIR = "/workspace/.export-tmp/pages";
const token = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN || "";

const attempts = [
  { Authorization: `Bearer ${token}` },
  { "X-Cursor-Authorization": `Bearer ${token}` },
  { "x-cursor-client-version": "cloud-agent" },
  { Authorization: `Bearer ${token}`, "x-cursor-client-version": "cloud-agent" },
];

async function tryAuth(headers) {
  const transport = new StreamableHTTPClientTransport(new URL("https://mcp.lovable.dev/mcp"), {
    requestInit: { headers },
  });
  const client = new Client({ name: "export", version: "1.0.0" });
  await client.connect(transport);
  const result = await client.callTool({ name: "list_files", arguments: { project_id: PROJECT_ID, limit: 2 } });
  await client.close();
  return result;
}

for (const headers of attempts) {
  try {
    const result = await tryAuth(headers);
    console.log("SUCCESS with", Object.keys(headers), JSON.stringify(result).slice(0, 200));
    process.exit(0);
  } catch (e) {
    console.log("FAIL", Object.keys(headers), e.message);
  }
}
process.exit(1);
