import BaseTable from "./BaseTable";

export type KvTableType = {
  name:string;
  value:any[];
}

export default class KvTable extends BaseTable{
  constructor() {
    super("wai_kv");
  }

  async saveRow(row:KvTableType){
    const sql = `
    INSERT INTO ${this.getTable()} (name,value)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE value = VALUES(value)
    `;
    try {
      let { name,value} = row;
      const params = [name,value];
      const result = await this.getDb().execute(sql, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }

  async getRow(name: string): Promise<KvTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE name = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [name]);
      if (result.length > 0) {
        return result[0] as KvTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async deleteRow(name: string): Promise<any> {
    const sql = `DELETE FROM ${this.getTable()} WHERE name = ?`;
    try {
      const result = await this.getDb().execute(sql, [name]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting:", error);
      return false;
    }
  }
}
