import BaseTable from "./BaseTable";

export type UserMsgTableType = {
  msgId?:number;
  userId:number;
}

export default class UserMsgTable extends BaseTable{
  constructor() {
    super("wai_user_msg");
  }
  /**
   * userId + msgId 是主键
   * 需求 userId 下的 msgId 自增
   * userId msgId
   *  1     1
   *  1     2
   *  2     1
   *  2     2
   * @param userId
   */
  async genMsgId(userId: number) {
    try {
      // Step 1: Get the max msgId belonging to the userId
      const maxMsgIdResult = await this.getMaxMsgId(userId);
      const maxMsgId = maxMsgIdResult !== null ? maxMsgIdResult : 0;

      // Step 2: Increment the msgId
      const newMsgId = Number(maxMsgId) + 1;
      // Step 3: Save the record
      await this.save({ userId, msgId: newMsgId });

      // Return the new msgId
      return newMsgId;
    } catch (error) {
      console.error('Error generating msgId:', error);
      throw error;
    }
  }

  protected async getMaxMsgId(userId: number): Promise<number> {
    const sql = `
    SELECT MAX(msgId) AS maxMsgId
    FROM ${this.getTable()}
    WHERE userId = ?`;
    try {
      const result = await this.getDb().query(sql, [userId]);
      const maxMsgId = result[0].maxMsgId;
      return maxMsgId || 0;
    } catch (error) {
      console.error('Error retrieving max msgId:', error);
      throw error;
    }
  }

  async save(row:UserMsgTableType){
    const sql = `
    INSERT INTO ${this.getTable()} (userId,msgId)
    VALUES (?, ?)`;
    try {
      const { userId,msgId} = row;
      const params = [userId,msgId];
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }
}
