import BaseTable from "./BaseTable";

export type TaskTableType = {
  id?:number;
  userId:number;
  chatId:number;
  msgId:number;
  isDone:boolean;
  isError:boolean;
  isGoing:boolean;
  msgDate:number;
}

export default class TaskTable extends BaseTable{
  constructor() {
    super("wai_task");
  }

  async save(row:TaskTableType){
    const sql = `
    INSERT INTO ${this.getTable()} (userId,chatId,msgId,isDone,isError,isGoing,msgDate)
    VALUES (?,?,?, ?, ?, ?, ?)`;
    try {
      const { userId,chatId,msgId,isDone,isError,isGoing,msgDate} = row;
      const params = [userId,chatId,msgId,isDone,isError,isGoing,msgDate];
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }
  async saveRows(rows:TaskTableType[]){
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      await this.save(row)
    }
  }

  async update(row: Partial<TaskTableType>) {
    const { id,userId,chatId,msgId, ...updatedFields } = row;
    const setValues = Object.entries(updatedFields)
      .map(([key, value]) => `${key} = ?`)
      .join(", ");

    const sql = `
    UPDATE ${this.getTable()}
    SET ${setValues}
    WHERE id = ?`;
    try {
      const params = [...Object.values(updatedFields), id];
      await this.getDb().execute(sql, params);
      return true;
    } catch (error) {
      console.error("Error updating row:", error);
      return false;
    }
  }

  async getRow(id: number): Promise<TaskTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE id = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [id]);
      if (result.length > 0) {
        return result[0] as TaskTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async getRowByUserIdAndMsgID(userId: number,msgId:number): Promise<TaskTableType | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE userId = ? and msgId = ?
    LIMIT 1`;

    try {
      const result = await this.getDb().query(sql, [userId,msgId]);
      if (result.length > 0) {
        return result[0] as TaskTableType;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }
  async deleteRow(id: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.getTable()} WHERE id = ?`;
    try {
      const result = await this.getDb().execute(sql, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting:", error);
      return false;
    }
  }

  /**
   * 每次获取 taskLen 条 isGoing 为 false 的 task 并将其 isGoing 置为 true
   * @param taskLen
   */
  async fetchTask(taskLen: number) {
    const sqlSelect = `
    SELECT *
    FROM ${this.getTable()}
    WHERE isGoing = FALSE
    LIMIT ?`;

    const sqlUpdate = `
    UPDATE ${this.getTable()}
    SET isGoing = TRUE
    WHERE id IN (?)`;

    try {

      const resultSelect = await this.getDb().query(sqlSelect, [taskLen]);
      if (resultSelect.length  === 0) {
        return [];
      }
      const taskIds = resultSelect.map((row:{id:number}) => row.id);

      if (taskIds.length === 0) {
        return []; // No tasks to update, return an empty array
      }
      const taskIdsString = taskIds.join(',');

      // Step 2: Update the isGoing status of the selected tasks
      await this.getDb().execute(sqlUpdate.replace('?', taskIdsString));

      // Return the updated task IDs
      return resultSelect;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      return []; // Return an empty array in case of an error
    }
  }

}
