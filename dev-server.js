const express = require('express');
const next = require('next');
const { createProxyMiddleware } = require('http-proxy-middleware');

const dev = true;
const app = next({ dev, dir: '.', conf: { 
  output: undefined,
  basePath: '',
  assetPrefix: '',
  trailingSlash: false,
  images: { unoptimized: true },
  experimental: { esmExternals: true }
}});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();
  
  // すべてのリクエストをNext.jsに転送
  server.all('*', (req, res) => {
    return handle(req, res);
  });
  
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
    console.log(`> Test page: http://localhost:${PORT}/test/microphone`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});