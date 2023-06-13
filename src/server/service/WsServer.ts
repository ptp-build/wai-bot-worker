import * as WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { WsClient } from './Client';
import { BusinessLogic } from './BusinessLogic';
import { Server } from './Server';

export class WsServer extends Server {
  private wsServer: WebSocket.Server;
  private clients: Map<string, WsClient> = new Map();

  constructor(port: number) {
    super(port);
    this.wsServer = new WebSocket.Server({ port: this.port });
  }

  start(): void {
    this.wsServer.on('connection', ws => {
      const id = uuidv4();
      // @ts-ignore
      const client = new WsClient(id, ws);
      this.clients.set(id, client);
      console.log(`[WsServer] on connection: `, id);
      const businessLogic = new BusinessLogic();
      businessLogic.setClient(client);

      ws.on('message', (message: Buffer) => {
        businessLogic.processMessage(message);
      });

      ws.on('close', () => {
        this.clients.delete(id);
      });
    });
  }
}
