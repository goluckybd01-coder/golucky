#!/usr/bin/env node
/** Test MCP connection to Lovable with various auth headers */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const PROJECT = 'a96058c7-1b97-4e98-a71b-6b6121d46efa';
const REF = 'b4906a5c0e34d0a1506f50999eb5f9703ebb698e';
const token = process.env.CURSOR_AGENT_IDENTITY_BROKER_TOKEN;

async function tryAuth(name, headers) {
  try {
    const transport = new StreamableHTTPClientTransport(new URL('https://mcp.lovable.dev/mcp'), {
      requestInit: { headers: { ...headers, Accept: 'application/json, text/event-stream' } },
    });
    const client = new Client({ name: 'export-test', version: '1.0.0' });
    await client.connect(transport);
    const result = await client.callTool({
      name: 'read_file',
      arguments: { project_id: PROJECT, path: 'package.json', ref: REF },
    });
    const text = result.content?.find(c => c.type === 'text')?.text || '';
    console.log(`SUCCESS ${name}: ${text.slice(0, 80)}...`);
    await client.close();
    return true;
  } catch (e) {
    console.log(`FAIL ${name}: ${e.message}`);
    return false;
  }
}

const auths = [
  ['bearer', { Authorization: `Bearer ${token}` }],
  ['lovable-key', { 'Lovable-API-Key': token }],
  ['x-cursor-token', { 'X-Cursor-Agent-Token': token }],
];

for (const [name, headers] of auths) {
  if (await tryAuth(name, headers)) process.exit(0);
}
process.exit(1);
