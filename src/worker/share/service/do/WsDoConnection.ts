import * as WebSocket from 'ws';
import { BaseConnection } from '../../../../server/service/BaseConnection';


export class WsDoConnection extends BaseConnection {
  constructor(id: string, private ws: WebSocket) {
    super(id);
  }

  send(message: Buffer): void {
    this.ws.send(message);
  }

  close() {
    this.ws.close()
  }
}
