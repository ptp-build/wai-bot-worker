import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { TcpClient } from './Client';
import { BusinessLogic } from './BusinessLogic';
import { Server } from './Server';

export class TcpServer extends Server {
  private server: net.Server;
  private clients: Map<string, TcpClient> = new Map();

  constructor(port: number) {
    super(port);
    this.server = net.createServer();
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('error', reject);
      //@ts-ignore
      this.server.listen(this.port, resolve);
      this.server.on('connection', socket => {
        const id = uuidv4();
        const client = new TcpClient(id, socket);
        this.clients.set(id, client);
        console.log(`[TcpServer] on connection: `, id);
        const businessLogic = new BusinessLogic();
        businessLogic.setClient(client);

        socket.on('data', data => {
          businessLogic.processMessage(data);
          socket.end(() => {
            this.clients.delete(id);
          });
        });
      });
    });
  }
}
