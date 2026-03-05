#!/usr/bin/env node

const SERVER_INFO = {
  name: 'adlab-mcp',
  version: '0.1.0',
};

const API_BASE = process.env.ADLAB_API_BASE || 'http://127.0.0.1:3001';
const REQUEST_TIMEOUT_MS = Number(process.env.ADLAB_API_TIMEOUT_MS || 30000);

const TOOL_DEFS = [
  {
    name: 'ads_list',
    description: 'List all ads from Ad Creative Lab.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'ads_get',
    description: 'Get one ad by id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Ad id' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'ads_create',
    description: 'Create an ad. concept is required by API.',
    inputSchema: {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          description: 'Body for POST /api/ads',
        },
      },
      required: ['data'],
      additionalProperties: false,
    },
  },
  {
    name: 'ads_update',
    description: 'Patch an ad by id.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Ad id' },
        data: { type: 'object', description: 'Patch body' },
      },
      required: ['id', 'data'],
      additionalProperties: false,
    },
  },
  {
    name: 'ads_move_status',
    description: 'Move ad status using /api/ads/:id/move with targetStatus.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Ad id' },
        targetStatus: {
          type: 'string',
          description: 'Target status, e.g. idea/testing/production/completed',
        },
      },
      required: ['id', 'targetStatus'],
      additionalProperties: false,
    },
  },
  {
    name: 'insights_list',
    description: 'List research insights.',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: 'insight_create',
    description: 'Create an insight (title/content).',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'api_request',
    description: 'Raw request against /api/* endpoints when you need flexibility.',
    inputSchema: {
      type: 'object',
      properties: {
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        },
        path: {
          type: 'string',
          description: 'Path like /api/ads or /api/ads/<id>',
        },
        body: {
          type: 'object',
          description: 'Optional JSON body for non-GET methods',
        },
      },
      required: ['method', 'path'],
      additionalProperties: false,
    },
  },
];

function log(msg) {
  process.stderr.write(`[adlab-mcp] ${msg}\n`);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireString(value, name) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} must be a non-empty string`);
  }
  return value.trim();
}

function toPrettyText(value) {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
}

async function requestApi(method, path, body) {
  const url = path.startsWith('http://') || path.startsWith('https://')
    ? path
    : new URL(path, API_BASE).toString();

  const headers = {};
  let payload;

  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });

    const text = await res.text();
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      const bodyText = typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      throw new Error(`HTTP ${res.status} ${res.statusText}: ${bodyText}`);
    }

    return parsed;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timeout after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runTool(name, args) {
  const input = args ?? {};

  switch (name) {
    case 'ads_list':
      return requestApi('GET', '/api/ads');

    case 'ads_get': {
      const id = requireString(input.id, 'id');
      return requestApi('GET', `/api/ads/${encodeURIComponent(id)}`);
    }

    case 'ads_create': {
      if (!isObject(input.data)) {
        throw new Error('data must be an object');
      }
      return requestApi('POST', '/api/ads', input.data);
    }

    case 'ads_update': {
      const id = requireString(input.id, 'id');
      if (!isObject(input.data)) {
        throw new Error('data must be an object');
      }
      return requestApi('PATCH', `/api/ads/${encodeURIComponent(id)}`, input.data);
    }

    case 'ads_move_status': {
      const id = requireString(input.id, 'id');
      const targetStatus = requireString(input.targetStatus, 'targetStatus');
      return requestApi('POST', `/api/ads/${encodeURIComponent(id)}/move`, { targetStatus });
    }

    case 'insights_list':
      return requestApi('GET', '/api/insights');

    case 'insight_create': {
      const payload = {
        title: typeof input.title === 'string' ? input.title : undefined,
        content: typeof input.content === 'string' ? input.content : undefined,
      };
      return requestApi('POST', '/api/insights', payload);
    }

    case 'api_request': {
      const method = requireString(input.method, 'method').toUpperCase();
      const path = requireString(input.path, 'path');

      if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        throw new Error('method must be one of GET/POST/PUT/PATCH/DELETE');
      }

      if (!path.startsWith('/api/')) {
        throw new Error('path must start with /api/');
      }

      if (method === 'GET' || method === 'DELETE') {
        return requestApi(method, path);
      }

      if (input.body !== undefined && !isObject(input.body)) {
        throw new Error('body must be an object when provided');
      }

      return requestApi(method, path, input.body ?? {});
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function writeMessage(msg) {
  const json = JSON.stringify(msg);
  const header = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\n\r\n`;
  process.stdout.write(header + json);
}

function sendResult(id, result) {
  writeMessage({ jsonrpc: '2.0', id, result });
}

function sendError(id, code, message, data) {
  writeMessage({
    jsonrpc: '2.0',
    id,
    error: {
      code,
      message,
      data,
    },
  });
}

async function handleRequest(msg) {
  const { id, method, params } = msg;

  if (method === 'initialize') {
    const clientVersion = params?.protocolVersion;
    sendResult(id, {
      protocolVersion: clientVersion || '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: SERVER_INFO,
    });
    return;
  }

  if (method === 'ping') {
    sendResult(id, {});
    return;
  }

  if (method === 'tools/list') {
    sendResult(id, { tools: TOOL_DEFS });
    return;
  }

  if (method === 'tools/call') {
    try {
      const toolName = params?.name;
      const toolArgs = params?.arguments ?? {};
      const data = await runTool(toolName, toolArgs);
      sendResult(id, {
        content: [
          {
            type: 'text',
            text: toPrettyText(data),
          },
        ],
      });
    } catch (error) {
      sendResult(id, {
        content: [
          {
            type: 'text',
            text: `Error: ${error?.message || String(error)}`,
          },
        ],
        isError: true,
      });
    }
    return;
  }

  sendError(id, -32601, `Method not found: ${method}`);
}

async function handleMessage(msg) {
  if (!msg || msg.jsonrpc !== '2.0') {
    return;
  }

  if (typeof msg.id === 'undefined') {
    if (msg.method === 'notifications/initialized') {
      return;
    }
    return;
  }

  await handleRequest(msg);
}

let buffer = Buffer.alloc(0);
const HEADER_END = Buffer.from('\r\n\r\n');

function processBuffer() {
  while (true) {
    const headerIndex = buffer.indexOf(HEADER_END);
    if (headerIndex === -1) {
      return;
    }

    const headerText = buffer.slice(0, headerIndex).toString('utf8');
    const lengthMatch = headerText.match(/content-length:\s*(\d+)/i);
    if (!lengthMatch) {
      buffer = buffer.slice(headerIndex + HEADER_END.length);
      continue;
    }

    const contentLength = Number(lengthMatch[1]);
    const messageStart = headerIndex + HEADER_END.length;
    const messageEnd = messageStart + contentLength;

    if (buffer.length < messageEnd) {
      return;
    }

    const bodyText = buffer.slice(messageStart, messageEnd).toString('utf8');
    buffer = buffer.slice(messageEnd);

    let msg;
    try {
      msg = JSON.parse(bodyText);
    } catch (error) {
      log(`Invalid JSON received: ${error?.message || error}`);
      continue;
    }

    handleMessage(msg).catch((error) => {
      log(`Unhandled error: ${error?.stack || error}`);
      if (typeof msg?.id !== 'undefined') {
        sendError(msg.id, -32000, error?.message || String(error));
      }
    });
  }
}

process.stdin.on('data', (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  processBuffer();
});

process.stdin.on('error', (err) => {
  log(`stdin error: ${err?.message || err}`);
});

process.on('uncaughtException', (err) => {
  log(`uncaughtException: ${err?.stack || err}`);
});

process.on('unhandledRejection', (reason) => {
  log(`unhandledRejection: ${reason?.stack || reason}`);
});

log(`started. apiBase=${API_BASE}`);
