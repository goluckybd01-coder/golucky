#!/usr/bin/env node
/**
 * Bulk export files from Lovable via @lovable.dev/sdk API.
 * Usage: node bulk_lovable_export.mjs [batch_size] [offset]
 */
import { LovableClient } from '@lovable.dev/sdk';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

const PROJECT_ID = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const REF = 'b4906a5c0e34d0a1506f50999eb5f9703ebb698e';
const WORKSPACE = '/workspace';
const MANIFEST = '/workspace/.export-tmp/full_manifest.json';

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

function loadManifest() {
  return JSON.parse(readFileSync(MANIFEST, 'utf8'));
}

function pending(paths) {
  return paths.filter(p => !existsSync(join(WORKSPACE, p)));
}

async function exportPaths(paths) {
  let ok = 0, fail = 0;
  const failures = [];
  for (const path of paths) {
    try {
      const content = await client.readFile(PROJECT_ID, path, REF);
      writeFile(path, content);
      ok++;
      if (ok % 25 === 0) console.error(`  exported ${ok}/${paths.length}`);
    } catch (e) {
      fail++;
      failures.push({ path, error: String(e.message || e) });
      console.error(`FAIL ${path}: ${e.message || e}`);
    }
  }
  return { ok, fail, failures };
}

const batchSize = parseInt(process.argv[2] || '0', 10);
const offset = parseInt(process.argv[3] || '0', 10);
const cmd = process.argv[4] || 'src';

const manifest = loadManifest();

let allPaths;
if (cmd === 'src') {
  allPaths = manifest.src_text_files || [];
} else if (cmd === 'text') {
  allPaths = manifest.text_files || [];
} else if (cmd === 'critical') {
  allPaths = [
    'package.json', 'index.html', 'vite.config.ts',
    'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json',
    'tailwind.config.ts', 'postcss.config.js', 'eslint.config.js', 'components.json',
    'src/App.tsx', 'src/main.tsx',
    'src/integrations/supabase/client.ts', 'src/integrations/supabase/types.ts',
    'public/robots.txt',
  ].filter(p => (manifest.text_files || []).includes(p) || p.startsWith('src/'));
  // Add supabase, scripts, github workflows from manifest
  for (const p of manifest.text_files || []) {
    if (p.startsWith('supabase/') || p.startsWith('scripts/') || p.startsWith('.github/') || p.startsWith('public/')) {
      if (!allPaths.includes(p)) allPaths.push(p);
    }
  }
} else {
  allPaths = manifest.text_files || [];
}

const todo = pending(allPaths);
const batch = batchSize > 0 ? todo.slice(offset, offset + batchSize) : todo;

console.error(`Exporting ${batch.length} files (${todo.length} pending total)...`);

const result = await exportPaths(batch);
console.log(JSON.stringify({ ...result, pending_after: todo.length - result.ok, exported: allPaths.length - todo.length + result.ok }));
