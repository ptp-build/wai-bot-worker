import { TCP_SERVER_PORT, WS_SERVER_PORT } from './config';
import { TcpServer } from './service/TcpServer';
import { WsServer } from './service/WsServer';

export async function startServers(tcpPort: number, wsPort: number): Promise<void> {
  const tcpServer = new TcpServer(tcpPort);
  await tcpServer.start();
  console.log(`TCP server started on port ${tcpPort}`);

  const wsServer = new WsServer(wsPort);
  wsServer.start();
  console.log(`WebSocket server started on port ${wsPort}`);
}

async function main() {
  await startServers(TCP_SERVER_PORT, WS_SERVER_PORT);
}

main();
