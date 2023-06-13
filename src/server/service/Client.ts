import * as net from 'net';
import * as WebSocket from 'ws';

export abstract class Client {
  constructor(public id: string) {}

  abstract send(message: Buffer): void;
}

export class TcpClient extends Client {
  constructor(id: string, private socket: net.Socket) {
    super(id);
  }

  send(message: Buffer): void {
    this.socket.write(message);
  }
}

export class WsClient extends Client {
  constructor(id: string, private ws: WebSocket) {
    super(id);
  }

  send(message: Buffer): void {
    this.ws.send(message);
  }
}
