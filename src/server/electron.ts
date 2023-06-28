import { startServers } from './server';
import { WAI_SERVER_PORT } from '../worker/setting';

export async function start_electron_server() {
  await startServers(
    WAI_SERVER_PORT,
    {
      IS_DEV:process.env.IS_DEV === "true" || false,
      IN_ELECTRON:true
    },
  );
}
