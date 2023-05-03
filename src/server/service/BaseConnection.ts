import * as net from 'net';

export abstract class BaseConnection {
  constructor(public id: string) {}
  abstract send(message: Buffer): void;
  abstract close(): void;
}

export class TcpConnection extends BaseConnection {
  constructor(id: string, private socket: net.Socket) {
    super(id);
  }

  send(message: Buffer): void {
    this.socket.write(message);
  }
  close() {
    //close
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
