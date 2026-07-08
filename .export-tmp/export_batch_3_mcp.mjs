#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const PROJECT = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const WORKSPACE = '/workspace';
const BATCH_FILE = '/workspace/.export-tmp/batch3_export_paths.json';
const CONCURRENCY = 6;
const ONLY_MISSING = process.argv.includes('--missing-only');

const token = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN;

async function createClient() {
  const transport = new StreamableHTTPClientTransport(new URL('https://mcp.lovable.dev/mcp'), {
    requestInit: {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Cursor-Agent': '1',
        Accept: 'application/json, text/event-stream',
      },
    },
  });
  const client = new Client({ name: 'batch3-export', version: '1.0.0' });
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

let paths = JSON.parse(readFileSync(BATCH_FILE, 'utf-8'));
if (ONLY_MISSING) {
  paths = paths.filter((p) => !existsSync(join(WORKSPACE, p)));
}

if (paths.length === 0) {
  console.log(JSON.stringify({ written: 0, failed: [], paths_written: [] }));
  process.exit(0);
}

const client = await createClient();
const results = await runPool(paths, async (path) => {
  const content = await readFile(client, path);
  writeFile(path, content);
  return { bytes: content.length };
});
await client.close();

const paths_written = results.filter((r) => r.ok).map((r) => r.path).sort();
const failed = results.filter((r) => !r.ok).map((r) => ({ path: r.path, error: r.error }));
console.log(JSON.stringify({ written: paths_written.length, failed, paths_written }));

process.exit(failed.length ? 1 : 0);
