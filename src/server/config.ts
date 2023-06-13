require('dotenv').config();

export const HTTP_SERVER_PORT = process.env.waiServerHttpPort || 1280;
export const WS_SERVER_PORT = process.env.waiServerWsPort || 1281;
export const TCP_SERVER_PORT = process.env.waiServerTcpPort || 1281;
