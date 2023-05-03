import { HTTP_SERVER_PORT, TCP_SERVER_PORT, WS_SERVER_PORT } from './config';
import { startServers } from './server';

async function main() {
  await startServers(parseInt(TCP_SERVER_PORT), parseInt(WS_SERVER_PORT),parseInt(HTTP_SERVER_PORT));
}
main().catch(console.error);
