import {CTX, ENV} from "../../env";
import {Client} from '@neondatabase/serverless';
import { currentTs1000 } from '../../share/utils/utils';

export class PgSqlNeon {
    getConnection(){
        return new Client(ENV.DATABASE_URL)
    }
    async query(sql:string){
        const startTime = currentTs1000();
        const client = this.getConnection()
        await client.connect();
        const {rows,rowCount} = await client.query(sql)
        CTX.waitUntil(client.end());
        return {
            rows,
            size:rowCount,
            time:currentTs1000() - startTime
        }
    }
}
