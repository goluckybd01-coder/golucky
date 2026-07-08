#!/usr/bin/env node
import { LovableClient } from '@lovable.dev/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

const PROJECT_ID = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const REF = 'b4906a5c0e34d0a1506f50999eb5f9703ebb698e';
const WORKSPACE = '/workspace';
const BATCH_FILE = '/workspace/.export-tmp/batch_2.json';

const token = process.env.LOVABLE_API_KEY || process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN;
if (!token) {
  console.error('No LOVABLE_API_KEY or CURSOR_AGENT_IDENTITY_BROKER_TOKEN');
  process.exit(1);
}

const client = new LovableClient(
  process.env.LOVABLE_API_KEY
    ? { apiKey: process.env.LOVABLE_API_KEY }
    : { bearerToken: token }
);

function writeFile(path, content) {
  const full = join(WORKSPACE, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content.endsWith('\n') ? content : content + '\n', 'utf8');
}

const paths = JSON.parse(readFileSync(BATCH_FILE, 'utf8'));
let exported = 0, skipped = 0, failed = 0;
const failures = [];

for (const path of paths) {
  const full = join(WORKSPACE, path);
  if (existsSync(full)) {
    skipped++;
    continue;
  }
  try {
    const content = await client.readFile(PROJECT_ID, path, REF);
    writeFile(path, content);
    exported++;
    if (exported % 25 === 0) console.error(`  exported ${exported}`);
  } catch (e) {
    failed++;
    failures.push({ path, error: String(e.message || e) });
    console.error(`FAIL ${path}: ${e.message || e}`);
  }
}

console.log(JSON.stringify({ total: paths.length, exported, skipped, failed, failures }));
