const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3001;
const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  console.error('Missing APIFY_TOKEN environment variable.');
  console.error('Usage: APIFY_TOKEN=your_token node server.js');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function proxyApify(datasetId, res) {
  const apifyUrl = `https://api.apify.com/v2/datasets/${encodeURIComponent(datasetId)}/items?token=${APIFY_TOKEN}`;

  https.get(apifyUrl, (upstream) => {
    const chunks = [];
    upstream.on('data', (c) => chunks.push(c));
    upstream.on('end', () => {
      const body = Buffer.concat(chunks);
      res.writeHead(upstream.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(body);
    });
  }).on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Upstream request failed', detail: err.message }));
  });
}

function serveStatic(filePath, res) {
  const ext = path.extname(filePath);
  const mime = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  // API proxy
  if (parsed.pathname === '/api/leads') {
    const datasetId = parsed.query.datasetId;
    if (!datasetId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing datasetId query parameter' }));
      return;
    }
    proxyApify(datasetId, res);
    return;
  }

  // Static files
  let filePath = parsed.pathname;
  if (filePath === '/') filePath = '/index.html';
  else if (filePath === '/dashboard') filePath = '/dashboard.html';
  filePath = path.join(__dirname, filePath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  serveStatic(filePath, res);
});

server.listen(PORT, () => {
  console.log(`Speed Syndicate Leads Dashboard running at http://localhost:${PORT}`);
});
