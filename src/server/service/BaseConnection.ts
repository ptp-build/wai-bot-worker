import * as net from 'net';
import {BaseConnection} from "../../sdk/types";

export class TcpConnection extends BaseConnection {
  constructor(id: string, private socket: net.Socket) {
    super(id);
  }

  send(message: Buffer): void {
    this.socket.write(message);
  }
  close() {

  }
}

export class WsConnection extends BaseConnection {
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
