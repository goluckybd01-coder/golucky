#!/usr/bin/env node
import { LovableClient } from '@lovable.dev/sdk';
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';

const PROJECT_ID = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const REF = '786c41f70907f7f4683b7d6ef61fe2ec4b995dbe';
const WRITE = '/workspace/tools/mcp_immediate_write.py';

const PATHS = [
  'src/components/admin/AdminAgentManagement.tsx',
  'src/components/admin/GameRevenueChart.tsx',
  'src/components/admin/TransactionStatsChart.tsx',
  'src/components/admin/UserActivityChart.tsx',
  'src/components/admin/UserRegistrationChart.tsx',
  'src/components/admin/UserRetentionChart.tsx',
  'src/components/admin/VIPDistributionChart.tsx',
  'src/components/agent/AgentCommissionAnalytics.tsx',
  'src/components/agent/AgentCommissionWithdrawHistory.tsx',
  'src/components/agent/AgentLeaderboard.tsx',
  'src/components/agent/AgentMilestoneRewards.tsx',
];

const SELF_IMPORT = /^import\s+\w+\s+from\s+["']@\/(?:components|pages)(?:\/[^"']+)?\/(\w+)["']/gm;

function isCorrupted(rel, content) {
  const stem = rel.split('/').pop().replace('.tsx', '');
  let m;
  while ((m = SELF_IMPORT.exec(content)) !== null) {
    if (m[1] === stem) return true;
  }
  return false;
}

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

let fixed = 0;
const failures = [];

for (const rel of PATHS) {
  try {
    const content = await client.readFile(PROJECT_ID, rel, { ref: REF });
    const r = spawnSync('python3', [WRITE, rel], { input: content, encoding: 'utf8' });
    if (r.status !== 0) {
      throw new Error((r.stderr || r.stdout || '').trim());
    }
    const written = readFileSync(`/workspace/${rel}`, 'utf8');
    if (isCorrupted(rel, written)) {
      throw new Error('still self-imports after write');
    }
    console.log((r.stdout || '').trim());
    fixed++;
  } catch (e) {
    failures.push({ path: rel, error: e.message || String(e) });
    console.error(`FAIL ${rel}: ${e.message || e}`);
  }
}

console.log(JSON.stringify({ fixed, total: PATHS.length, failures }));
process.exit(fixed === PATHS.length ? 0 : 1);
