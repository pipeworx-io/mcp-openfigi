interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * OpenFIGI MCP — financial-instrument symbology.
 *
 * Auth: none for free tier (25 req/min, 5 jobs/req). With X-OPENFIGI-APIKEY
 * the tier rises substantially; pass via ?_apiKey=…
 *
 * Docs: https://www.openfigi.com/api
 */


const BASE = 'https://api.openfigi.com/v3';
const UA = 'pipeworx-mcp-openfigi/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'map',
    description: 'Map a batch of instrument-id queries → FIGIs.',
    inputSchema: {
      type: 'object',
      properties: {
        jobs: {
          type: 'array',
          items: { type: 'object' },
          description: 'Each job: {idType, idValue, exchCode?, securityType?, marketSecDes?, currency?}.',
        },
      },
      required: ['jobs'],
    },
  },
  {
    name: 'search',
    description: 'Text search across instruments.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        exchCode: { type: 'string' },
        currency: { type: 'string' },
        securityType: { type: 'string' },
        marketSecDes: { type: 'string' },
      },
      required: ['query'],
    },
  },
  {
    name: 'filter',
    description: 'Filter search by idType + value (subset of /search).',
    inputSchema: {
      type: 'object',
      properties: {
        idType: { type: 'string' },
        value: { type: 'string' },
        exchCode: { type: 'string' },
        currency: { type: 'string' },
      },
      required: ['idType', 'value'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  switch (name) {
    case 'map': {
      const jobs = args.jobs;
      if (!Array.isArray(jobs) || jobs.length === 0) throw new Error('jobs must be a non-empty array.');
      return ofPost('/mapping', jobs, apiKey);
    }
    case 'search': {
      const body: Record<string, unknown> = { query: reqStr(args, 'query', '"Apple"') };
      for (const k of ['exchCode', 'currency', 'securityType', 'marketSecDes'] as const) {
        if (args[k]) body[k] = String(args[k]);
      }
      return ofPost('/search', body, apiKey);
    }
    case 'filter': {
      const body: Record<string, unknown> = {
        idType: reqStr(args, 'idType', '"TICKER"'),
        idValue: reqStr(args, 'value', '"AAPL"'),
      };
      for (const k of ['exchCode', 'currency'] as const) {
        if (args[k]) body[k] = String(args[k]);
      }
      return ofPost('/filter', body, apiKey);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function ofPost(path: string, body: unknown, apiKey: string | undefined): Promise<unknown> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'User-Agent': UA,
  };
  if (apiKey) headers['X-OPENFIGI-APIKEY'] = apiKey;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (res.status === 429) throw new Error('OpenFIGI: 429 rate-limit. Free tier is 25 req/min; pass an apiKey for more.');
  if (!res.ok) throw new Error(`OpenFIGI: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
