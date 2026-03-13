// Claude API calls — ported from index.html callAPI() and callAPIObj().
// Behaviour is preserved exactly: JSON parsed by finding first [ to last ] (or { to }).

import { BASE_URL } from './proxy';

// Multi-result call. search=true enables web_search tool (default).
// Returns parsed JSON array.
export async function callAPI(system, msg, search = true) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    system: system,
    messages: [{ role: 'user', content: msg }],
  };
  if (search) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const res = await fetch(`${BASE_URL}/proxy/anthropic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const d = await res.json();

  // Collect all text blocks from the response (Claude may interleave tool use).
  const text = (d.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const s = text.indexOf('[');
  const e = text.lastIndexOf(']');
  if (s === -1 || e === -1) throw new Error('No JSON array in response');
  return JSON.parse(text.slice(s, e + 1));
}

// Single-object call. No web search. Returns parsed JSON object.
export async function callAPIObj(system, msg) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: system,
    messages: [{ role: 'user', content: msg }],
  };

  const res = await fetch(`${BASE_URL}/proxy/anthropic`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const d = await res.json();

  const text = (d.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('No JSON object in response');
  return JSON.parse(text.slice(s, e + 1));
}
