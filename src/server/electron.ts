import { startServers } from './server';

export async function start_electron_server(port:number) {

  await startServers(
    Number(port),
    {
      IS_DEV:process.env.IS_DEV === "true" || false,
      IN_ELECTRON:true
    },
  );
}
