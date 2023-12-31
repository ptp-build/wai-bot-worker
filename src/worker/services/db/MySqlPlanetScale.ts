import {connect, ExecutedQuery} from "@planetscale/database";
import BaseDb from "./BaseDb";

export class MySqlPlanetScale extends BaseDb {
  private config: {
    host: string;
    username: string;
    password: string;
  } | null = null;

  setConfig(config: { host: string; username: string; password: string }) {
    this.config = config;
    // console.log("[MySqlPlanetScale setConfig]")
    return this;
  }

  getConnection() {
    // console.log("[MySqlPlanetScale getConnection]")

    if (!this.config) {
      throw new Error("Database configuration is not set");
    }

    const { host, username, password } = this.config;
    // console.log("[MySqlPlanetScale getConnection]",host,username)

    return connect({
      host,
      username,
      password,
      fetch: (url: string, init: any) => {
        // console.log("[MySqlPlanetScale fetch]",url)
        delete init["cache"];
        return fetch(url, init);
      }
    });
  }

  async query(sql: string, args?: any[]) {
    const conn = await this.getConnection();
    // console.log("[query]",sql,args)
    const res:ExecutedQuery= await conn.execute(sql, args || []);
    const {rows,headers,size,time} = res;
    // console.log("[query]",time,rows.length,size,sql,args)
    return rows;
  }

  async execute(sql: string, args?: any[]) {
    const conn = await this.getConnection();
    const {insertId,rowsAffected,time}:ExecutedQuery = await conn.execute(sql, args || []);
    // console.log("[execute]",{time,insertId,rowsAffected},sql)
    return {affectedRows:rowsAffected,insertId:parseInt(insertId)};
  }
}
