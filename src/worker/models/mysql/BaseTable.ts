import DbStorage from "../../services/db/DbStorage";

export default class BaseTable{

  private db: DbStorage;
  private table: string;

  constructor(table:string) {
    this.table = table;
    this.db = DbStorage.getInstance();
  }
  setDb(db:DbStorage){
    this.db = db
    return this
  }

  setTable(table:string){
    this.table = table
    return this
  }
  getTable(){
    return this.table
  }

  getDb(){
    return this.db
  }
  async execute(sql:string,params?:any[]): Promise<number | null> {
    try {
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding HTTP request:", error);
      return null;
    }
  }

  async query(sql:string): Promise<any[]> {
    try {
      return await this.getDb().query(sql);
    } catch (error) {
      console.error("Error retrieving HTTP requests:", error);
      return [];
    }
  }

  async delete(id: number | number[]): Promise<boolean> {
    const sql = `DELETE FROM ${this.table} WHERE id = ?`;
    try {
      const result = await this.getDb().execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting HTTP request:", error);
      return false;
    }
  }
}
