const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = true;
const hostname = 'localhost';
const port = 3000;

// Next.js設定を強制的に上書き
const app = next({ 
  dev, 
  hostname, 
  port, 
  dir: '.', 
  conf: {
    output: undefined,
    basePath: '',
    assetPrefix: '',
    trailingSlash: false,
    images: { unoptimized: true },
    experimental: { esmExternals: true }
  }
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  })
  .listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Test page: http://${hostname}:${port}/test/microphone`);
  });
});