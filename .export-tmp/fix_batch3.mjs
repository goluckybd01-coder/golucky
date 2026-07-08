#!/usr/bin/env node
import { LovableClient } from '@lovable.dev/sdk';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';

const PROJECT_ID = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const WRITE = '/workspace/tools/mcp_immediate_write.py';
const PATHS_FILE = '/workspace/.export-tmp/fix_batch3_paths.json';

const token = process.env.LOVABLE_API_KEY || process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN;
if (!token) {
  console.error('No auth token');
  process.exit(1);
}

const client = new LovableClient(
  process.env.LOVABLE_API_KEY
    ? { apiKey: process.env.LOVABLE_API_KEY }
    : { bearerToken: token }
);

const paths = JSON.parse(readFileSync(PATHS_FILE, 'utf8'));
let fixed = 0;
const failures = [];

for (const rel of paths) {
  try {
    const content = await client.readFile(PROJECT_ID, rel);
    const r = spawnSync('python3', [WRITE, rel], { input: content, encoding: 'utf8' });
    if (r.status !== 0) {
      throw new Error((r.stderr || r.stdout || '').trim());
    }
    console.log((r.stdout || '').trim());
    fixed++;
  } catch (e) {
    failures.push({ path: rel, error: e.message || String(e) });
    console.error(`FAIL ${rel}: ${e.message || e}`);
  }
}

console.log(JSON.stringify({ fixed, total: paths.length, failures }));
