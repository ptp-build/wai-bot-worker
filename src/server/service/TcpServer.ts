import * as net from 'net';
import { v4 as uuidv4 } from 'uuid';
import { BaseServer } from './BaseServer';
import { TcpConnection } from './BaseConnection';

export class TcpServer extends BaseServer {
  private server: net.Server;
  private connections: Map<string, TcpConnection> = new Map();

  constructor(port: number) {
    super(port);
    this.server = net.createServer();
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.on('error', reject);
      //@ts-ignore
      this.server.listen(this.port, resolve);
      this.server.on('connection', socket => {
        const id = uuidv4();
        const connection = new TcpConnection(id, socket);
        this.connections.set(id, connection);
        console.log(`[TcpServer] on connection: `, id);
        socket.on('data', data => {

          socket.end(() => {
            this.connections.delete(id);
          });
        });
      });
    });
  }
}
