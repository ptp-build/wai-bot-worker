import BaseTable from "./BaseTable";
import { LocalWorkerAccountType } from '../../../sdk/types';

export type WorkerAccountTableType = {
  botId?:number;
  data:LocalWorkerAccountType;
  isDeleted?:boolean
}

export default class WorkerAccountTable extends BaseTable{
  constructor() {
    super("wai_worker_account");
  }

  async save(row:WorkerAccountTableType){
    const sql = `
    INSERT INTO ${this.getTable()} (botId,data,isDeleted)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
       data = VALUES(data),
       isDeleted = VALUES(isDeleted)`;
  try {
      let { botId,data,isDeleted } = row;
      if(!isDeleted){
        isDeleted = false
      }
      const params = [botId,data,isDeleted];
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }

  async update(row: Partial<WorkerAccountTableType>) {
    const { botId, ...updatedFields } = row;
    const setValues = Object.entries(updatedFields)
      .map(([key, value]) => `${key} = ?`)
      .join(", ");

    const sql = `
    UPDATE ${this.getTable()}
    SET ${setValues}
    WHERE botId = ?`;
    try {
      const params = [...Object.values(updatedFields), botId];
      await this.getDb().execute(sql, params);
      return true;
    } catch (error) {
      console.error("Error updating row:", error);
      return false;
    }
  }

  async getRow(botId: number): Promise<WorkerAccountTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE botId = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [botId]);
      if (result.length > 0) {
        return result[0] as WorkerAccountTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async deleteRow(botId: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.getTable()} WHERE botId = ?`;
    try {
      const result = await this.getDb().execute(sql, [botId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting:", error);
      return false;
    }
  }
}
