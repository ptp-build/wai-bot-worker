require('dotenv').config();

export const HTTP_SERVER_PORT = process.env.waiServerHttpPort || "5080";
export const WS_SERVER_PORT = process.env.waiServerWsPort || "5081";
export const TCP_SERVER_PORT = process.env.waiServerTcpPort || "5082";

