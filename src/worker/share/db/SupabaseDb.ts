import {ENV} from "../../env";
import {createClient} from '@supabase/supabase-js';
import {currentTs1000} from "../utils/utils";

export class SupabaseDb {
    getConnection(){
        return createClient(ENV.SUPABASE_URL!, ENV.SUPABASE_KEY!)
    }
    async query(relation:string,columns:string){
        const startTime = currentTs1000();

        const { data, error } = await this.getConnection().from("countries").select(columns);
        if (error) throw error;
        const rows = [...data]
        return {
            rows,
            size:rows.length,
            time:currentTs1000() - startTime
        }
    }
}
