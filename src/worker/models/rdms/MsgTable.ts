import BaseTable from "./BaseTable";
import {ApiChatMsg} from "../../../sdk/types";

export default class MsgTable extends BaseTable{
  private chatId?:string
  constructor() {
    super("wai_msg");
  }
  async createTable(chatId:string){
    if(chatId!.startsWith("-")){
      chatId = chatId!.substring(1)
    }
    await this.getDb().execute("CREATE TABLE IF NOT EXISTS `wai_msg_"+chatId+"` (\n" +
      "  `id` int unsigned NOT NULL AUTO_INCREMENT,\n" +
      "  `chatId` varchar(20) DEFAULT NULL,\n" +
      "  `msgId` bigint DEFAULT NULL,\n" +
      "  `text` longtext,\n" +
      "  `inlineButtons` json DEFAULT NULL,\n" +
      "  `entities` json DEFAULT NULL,\n" +
      "  `content` json DEFAULT NULL,\n" +
      "  `msgDate` int DEFAULT NULL,\n" +
      "  `senderId` varchar(20) DEFAULT NULL,\n" +
      "  `isOutgoing` tinyint(1) DEFAULT NULL,\n" +
      "  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,\n" +
      "  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,\n" +
      "  PRIMARY KEY (`id`),\n" +
      "  UNIQUE KEY `chatId` (`chatId`,`msgId`)\n" +
      ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;");
  }
  getTable(){
    if(!this.chatId){
      throw new Error("chat is is null")
    }
    if(this.chatId!.startsWith("-")){
      this.chatId = this.chatId!.substring(1)
    }
    return super.getTable() + "_" + this.chatId
  }
  async save(row:ApiChatMsg){
    this.chatId = row.chatId
    await this.createTable(this.chatId)
    const sql = `INSERT INTO ${this.getTable()} (chatId,msgId,text,inlineButtons,entities,content,msgDate,senderId,isOutgoing)
    VALUES (?, ?, ?, ?, ?, ?, ?,?,?)
    ON DUPLICATE KEY UPDATE
      text = VALUES(text),
      inlineButtons = VALUES(inlineButtons),
      entities = VALUES(entities),
      msgDate = VALUES(msgDate),
      content = VALUES(content),
      senderId = VALUES(senderId),
      isOutgoing = VALUES(isOutgoing)`;
    try {
      const { chatId,msgId,text,inlineButtons,entities,content,msgDate,senderId,isOutgoing} = row;
      const params = [chatId,msgId,text,inlineButtons || [],entities || [],content|| {},msgDate,senderId,isOutgoing];
      console.debug("[save]",row)
      const result = await this.getDb().execute(sql, params);
      return result.insertId;
    } catch (error) {
      console.error("Error adding row:", error);
      return null;
    }
  }

  async update(row: Partial<ApiChatMsg>) {
    const { msgId, chatId, ...updatedFields } = row;
    this.chatId = row.chatId
    if(Object.keys(updatedFields).includes("content") && updatedFields.content === undefined){
      updatedFields.content = {}
    }
    await this.createTable(this.chatId!)
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

  async getRow(chatId: string, msgId: number): Promise<ApiChatMsg | null> {
    this.chatId = chatId
    await this.createTable(this.chatId!)
    const sql = `
    SELECT *
    FROM ${this.getTable()}
    WHERE chatId = ? AND msgId = ?
    LIMIT 1
  `;

    try {
      const result = await this.getDb().query(sql, [chatId, msgId]);
      if (result.length > 0) {
        return result[0] as ApiChatMsg;
      } else {
        return null; // No matching row found
      }
    } catch (error) {
      console.error("Error retrieving row:", error);
      return null;
    }
  }

  async deleteRow(chatId:string,msgId: number): Promise<boolean> {
    this.chatId = chatId
    await this.createTable(this.chatId!)
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
