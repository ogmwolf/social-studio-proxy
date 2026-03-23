module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  const correct = process.env.APP_PASSWORD || '';

  if (password === correct) {
    return res.status(200).json({
      ok: true,
      bearer_token: process.env.X_BEARER_TOKEN || '',
    });
  }

  return res.status(200).json({ ok: false });
};
