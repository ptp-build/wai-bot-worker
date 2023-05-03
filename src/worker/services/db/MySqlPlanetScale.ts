import {ENV} from "../../env";
import {connect} from "@planetscale/database";

export class MySqlPlanetScale {
    getConnection(){
        const config = {
            host: ENV.DATABASE_HOST,
            username: ENV.DATABASE_USERNAME,
            password: ENV.DATABASE_PASSWORD,
            fetch: (url:string, init:any) => {
                delete (init)["cache"];
                return fetch(url, init);
            }
        }

        return connect(config)
    }
    async query(sql:string){
        const conn = this.getConnection()
        const {rows,headers,size,time} = await conn.execute('SELECT * FROM products;')

        return {
            headers,
            rows,
            size,
            time
        }
    }
}
