module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-api-key, anthropic-version');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    if (response.status !== 200) {
      const errText = await response.text();
      console.error(`Anthropic error ${response.status}:`, errText);
      res.setHeader('Content-Type', 'application/json');
      return res.status(response.status).send(errText);
    }

    const data = await response.json();
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);
  } catch (e) {
    res.setHeader('Content-Type', 'application/json');
    if (e.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timed out after 45 seconds' });
    }
    return res.status(500).json({ error: e.message });
  } finally {
    clearTimeout(timeout);
  }
};
