import BaseTable from "./BaseTable";
import {NewMessage} from "../../../types";

export default class MsgTable extends BaseTable{
  constructor() {
    super("wai_msg");
  }
  async save(row:NewMessage){
    const sql = `
    INSERT INTO ${this.getTable()} (chatId,msgId,text,inlineButtons,entities,msgDate,senderId,isOutgoing)
    VALUES (?, ?, ?, ?, ?, ?,?,?)
    ON DUPLICATE KEY UPDATE
      text = VALUES(text),
      inlineButtons = VALUES(inlineButtons),
      entities = VALUES(entities),
      msgDate = VALUES(msgDate),
      senderId = VALUES(senderId),
      isOutgoing = VALUES(isOutgoing)
  `;
    try {
      const { chatId,msgId,text,inlineButtons,entities,msgDate,senderId,isOutgoing} = row;
      const params = [chatId,msgId,text,inlineButtons || [],entities || [],msgDate,senderId,isOutgoing];
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }
  async saveRows(rows:NewMessage[]){
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      await this.save(row)
    }
  }

  async update(row: Partial<NewMessage>) {
    const { msgId, chatId, ...updatedFields } = row;
    const setValues = Object.entries(updatedFields)
      .map(([key, value]) => `${key} = ?`)
      .join(", ");

    const sql = `
    UPDATE ${this.getTable()}
    SET ${setValues}
    WHERE msgId = ? AND chatId = ?
  `;

    try {
      const params = [...Object.values(updatedFields), msgId, chatId];
      await this.getDb().execute(sql, params);
      return true;
    } catch (error) {
      console.error("Error updating row:", error);
      return false;
    }
  }

  async getRow(chatId: string, msgId: number): Promise<NewMessage | null> {
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE chatId = ? AND msgId = ?
    LIMIT 1
  `;

    try {
      const result = await this.getDb().query(sql, [chatId, msgId]);
      if (result.length > 0) {
        return result[0] as NewMessage;
      } else {
        return null; // No matching row found
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async deleteRow(chatId:string,msgId: number): Promise<boolean> {
    const sql = `DELETE FROM ${this.getTable()} WHERE chatId = ? and msgId = ?`;
    try {
      const result = await this.getDb().execute(sql, [chatId,msgId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Error deleting msg:", error);
      return false;
    }
  }
}
