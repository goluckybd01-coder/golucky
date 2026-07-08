#!/usr/bin/env node
/** Fetch specific paths from Lovable SDK and write via mcp_immediate_write.py */
import { LovableClient } from '@lovable.dev/sdk';
import { spawnSync } from 'child_process';
import { readFileSync, existsSync, statSync } from 'fs';

const PROJECT_ID = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const REF = 'b4906a5c0e34d0a1506f50999eb5f9703ebb698e';
const WRITE = '/workspace/tools/mcp_immediate_write.py';
const PATHS_FILE = '/workspace/.export-tmp/batch_missing_paths.json';
const SKIP = new Set(['src/hooks/useAuth.ts']);

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
let written = 0;
let skipped = 0;
let failed = 0;

for (const rel of paths) {
  if (SKIP.has(rel)) {
    console.log(`SKIP not in Lovable: ${rel}`);
    skipped++;
    continue;
  }
  const dest = `/workspace/${rel}`;
  try {
    if (existsSync(dest) && statSync(dest).size > 0) {
      console.log(`SKIP existing: ${rel}`);
      skipped++;
      written++;
      continue;
    }
    const content = await client.readFile(PROJECT_ID, rel, REF);
    const r = spawnSync('python3', [WRITE, rel], { input: content, encoding: 'utf8' });
    if (r.status !== 0) {
      console.error(`FAIL ${rel}: ${r.stderr || r.stdout}`);
      failed++;
      continue;
    }
    console.log((r.stdout || '').trim());
    written++;
  } catch (e) {
    console.error(`FAIL ${rel}: ${e.message || e}`);
    failed++;
  }
}

console.log(JSON.stringify({ written, skipped, failed }));
