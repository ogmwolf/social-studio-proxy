// Claude API calls — ported from index.html callAPI() and callAPIObj().
// Behaviour is preserved exactly: JSON parsed by finding first [ to last ] (or { to }).

import { BASE_URL } from './proxy';

const CLAUDE_TIMEOUT_MS = 45000;

// Shared fetch wrapper: 45s timeout + res.ok check.
async function claudeFetch(body) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLAUDE_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(`${BASE_URL}/proxy/anthropic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Request timed out — try again.');
    throw e;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || err.detail || `Server error ${res.status}`);
  }

  return res.json();
}

// Multi-result call. search=true enables web_search tool (default).
// Returns parsed JSON array.
export async function callAPI(system, msg, search = true, maxTokens = 4000) {
  const body = {
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: system,
    messages: [{ role: 'user', content: msg }],
  };
  if (search) {
    body.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  const d = await claudeFetch(body);

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

// Single-object Haiku call. Web search enabled. Returns parsed JSON object.
export async function callAPIHaiku(system, msg) {
  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: system,
    messages: [{ role: 'user', content: msg }],
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
  };

  const d = await claudeFetch(body);

  const text = (d.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  const s = text.indexOf('{');
  const e = text.lastIndexOf('}');
  if (s === -1 || e === -1) throw new Error('No JSON object in response');
  return JSON.parse(text.slice(s, e + 1));
}

