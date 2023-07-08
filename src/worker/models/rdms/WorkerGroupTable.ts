import BaseTable from "./BaseTable";

export type WorkerGroupTableType = {
  chatId?:string;
  data:any;
  isDeleted?:boolean
}

export default class WorkerGroupTable extends BaseTable{
  constructor() {
    super("wai_worker_group");
  }

  async save(row:WorkerGroupTableType){
    const sql = `
    INSERT INTO ${this.getTable()} (chatId,data,isDeleted)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
       data = VALUES(data),
       isDeleted = VALUES(isDeleted)`;
  try {
      let { chatId,data,isDeleted } = row;
      if(!isDeleted){
        isDeleted = false
      }
      const params = [chatId,data,isDeleted];
      const result = await this.getDb().execute(sql, params);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }

  async update(row: Partial<WorkerGroupTableType>) {
    const { chatId, ...updatedFields } = row;
    const setValues = Object.entries(updatedFields)
      .map(([key, value]) => `${key} = ?`)
      .join(", ");

    const sql = `
    UPDATE ${this.getTable()}
    SET ${setValues}
    WHERE chatId = ?`;
    try {
      const params = [...Object.values(updatedFields), chatId];
      await this.getDb().execute(sql, params);
      return true;
    } catch (error) {
      console.error("Error updating row:", error);
      return false;
    }
  }

  async getRow(chatId: string): Promise<WorkerGroupTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE chatId = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [chatId]);
      if (result.length > 0) {
        return result[0] as WorkerGroupTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async deleteRow(chatId: string): Promise<boolean> {
    const sql = `UPDATE ${this.getTable()} set isDeleted = true WHERE chatId = ?`;
    try {
      const result = await this.getDb().execute(sql, [chatId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting:", error);
      return false;
    }
  }
}
