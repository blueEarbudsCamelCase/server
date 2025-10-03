// Minimal express proxy with /proxy and /healthz
const express = require('express');
const { PassThrough } = require('stream');
const fetch = (...args) => import('node-fetch').then(m => m.default(...args));
const app = express();

app.get('/healthz', (req, res) => res.status(200).send('OK'));

app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) return res.status(400).send('Missing url parameter');
    try { new URL(url); } catch (err) { return res.status(400).send('Invalid URL'); }

    const upstream = await fetch(url, { method: 'GET' });
    res.status(upstream.status);

    const contentType = upstream.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    // stream body
    const passthrough = new PassThrough();
    upstream.body.pipe(passthrough).pipe(res);
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('Proxy error');
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));