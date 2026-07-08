#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const PROJECT = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const WORKSPACE = '/workspace';
const BATCH_FILE = '/workspace/.export-tmp/batch1_pages.json';
const CONCURRENCY = 6;

const token = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN;
if (!token) {
  console.error(JSON.stringify({ error: 'CURSOR_AGENT_IDENTITY_BROKER_TOKEN missing' }));
  process.exit(1);
}

async function createClient() {
  const transport = new StreamableHTTPClientTransport(new URL('https://mcp.lovable.dev/mcp'), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json, text/event-stream',
      },
    },
  });
  const client = new Client({ name: 'batch1-pages-export', version: '1.0.0' });
  await client.connect(transport);
  return client;
}

function writeFile(path, content) {
  const full = join(WORKSPACE, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.endsWith('\n') ? content : content + '\n', 'utf-8');
}

async function readFile(client, path) {
  const result = await client.callTool({
    name: 'read_file',
    arguments: { project_id: PROJECT, path },
  });
  const text = result.content?.find((c) => c.type === 'text')?.text ?? '';
  if (!text || text.startsWith('Lovable API error')) {
    throw new Error(text || 'empty response');
  }
  return text;
}

async function runPool(items, worker) {
  const results = [];
  let index = 0;
  async function next() {
    while (index < items.length) {
      const i = index++;
      try {
        results[i] = { path: items[i], ok: true, ...(await worker(items[i])) };
      } catch (e) {
        results[i] = { path: items[i], ok: false, error: String(e.message || e) };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, next));
  return results;
}

const paths = JSON.parse(readFileSync(BATCH_FILE, 'utf-8'));
const client = await createClient();
const results = await runPool(paths, async (path) => {
  const content = await readFile(client, path);
  writeFile(path, content);
  return { bytes: content.length };
});
await client.close();

const written = results.filter((r) => r.ok).map((r) => r.path);
const failed = results.filter((r) => !r.ok).map((r) => ({ path: r.path, error: r.error }));

console.log(JSON.stringify({ written: written.length, failed, paths_written: written }));
