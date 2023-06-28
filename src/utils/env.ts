require("dotenv")

export function getMySqlConfigFromEnv(){
  return {
    database: process.env.MYSQL_DATABASE || "wai",
    host: process.env.MYSQL_HOST ||  "127.0.01",
    password: process.env.MYSQL_PASSWORD ||  "root",
    user: process.env.MYSQL_USER ||  "root"
  }
}
