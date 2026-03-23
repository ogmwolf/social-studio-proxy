const { parse } = require('node-html-parser');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body || {};

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      redirect: 'follow',
    });

    clearTimeout(timeout);

    const html = await response.text();
    const root = parse(html);

    const title = root.querySelector('title')?.text?.trim() || '';

    let desc = '';
    const metaDesc =
      root.querySelector('meta[name="description"]') ||
      root.querySelector('meta[property="og:description"]');
    if (metaDesc) {
      desc = (metaDesc.getAttribute('content') || '').substring(0, 500);
    }
    if (!desc) {
      const p = root.querySelector('p');
      if (p) desc = p.text.substring(0, 500);
    }

    const summary = (title + '. ' + desc).trim();
    return res.status(200).json({ title, summary });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
};
