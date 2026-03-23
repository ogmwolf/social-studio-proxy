module.exports = async function handler(req, res) {
  const url = req.query.url || '';

  if (!url || !url.includes('twimg.com')) {
    return res.status(400).send('Invalid');
  }

  try {
    const response = await fetch(url, {
      headers: {
        Referer: 'https://twitter.com/',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(response.status).send(Buffer.from(buffer));
  } catch (e) {
    return res.status(500).send(e.message);
  }
};
