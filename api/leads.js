const https = require('https');

module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'APIFY_TOKEN not configured on server' }));
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const datasetId = url.searchParams.get('datasetId');

  if (!datasetId) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Missing datasetId query parameter' }));
    return;
  }

  const apifyUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${token}`;

  return new Promise((resolve, reject) => {
    https.get(apifyUrl, (upstream) => {
      const chunks = [];
      upstream.on('data', (c) => chunks.push(c));
      upstream.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        res.statusCode = upstream.statusCode;
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
        resolve();
      });
    }).on('error', (err) => {
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Upstream request failed', detail: err.message }));
      resolve();
    });
  });
};
