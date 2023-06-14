import { WaiRouter } from '../../worker/route';
import * as http from 'http';

export class HttpServer {
  private server?: http.Server;
  private port: number;
  private router: WaiRouter;

  constructor(port: number, router: WaiRouter) {
    this.port = port;
    this.router = router;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        const { url, method } = req;
        let body = '';
        console.log(`${method} ${url}`)
        const reqUrl = `http://${req.headers.host}${url}`
        if (method === 'POST' || method === 'PUT') {
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', async () => {
            //@ts-ignore
            const request = new Request(reqUrl, { method, body, headers: req.headers });
            const response = await this.router.handleRequest(request);
            res.writeHead(response.status, Object.fromEntries(response.headers));
            res.end(await response.text());
          });
        } else if (method === 'GET') {
          //@ts-ignore
          const request = new Request(reqUrl, { method, headers: req.headers });
          const response = await this.router.handleRequest(request);
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(await response.text());
        } else {
          res.writeHead(405, { 'Content-Type': 'text/plain' });
          res.end('Method Not Allowed');
        }
      });

      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }
}
