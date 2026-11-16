import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../frontend');
const port = Number(process.env.PORT || 8765);
const apiOrigin = process.env.API_ORIGIN || 'http://127.0.0.1:3010';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

const immutableExt = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.woff', '.woff2']);

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      const target = new URL(url.pathname + url.search, apiOrigin);
      const headers = { ...req.headers, host: target.host };
      delete headers['content-length'];
      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
        duplex: 'half',
        redirect: 'manual',
      });
      const outHeaders = Object.fromEntries(upstream.headers);
      // Keep browser cookies on the storefront origin.
      res.writeHead(upstream.status, outHeaders);
      if (upstream.body) {
        for await (const chunk of upstream.body) res.write(chunk);
      }
      res.end();
      return;
    }

    let filePath = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname === '/' || url.pathname.endsWith('/')) {
      filePath = path.join(root, 'index.html');
    }
    if (!filePath.startsWith(root) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.writeHead(404, { 'Cache-Control': 'no-store' }).end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      'Content-Type': types[ext] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else if (ext === '.css' || ext === '.js') {
      // Query-string cache bust in index.html; avoid stale Telegram WebView CSS.
      headers['Cache-Control'] = 'no-cache, must-revalidate';
    } else if (immutableExt.has(ext)) {
      headers['Cache-Control'] = 'public, max-age=604800, immutable';
    } else {
      headers['Cache-Control'] = 'public, max-age=300';
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(502).end('Bad gateway');
    else res.end();
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Frontend http://127.0.0.1:${port} → API ${apiOrigin}`);
});
