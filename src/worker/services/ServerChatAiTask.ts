import ServerSession from "./ServerSession";
import BaseObject from "./BaseObject";
import {currentTs1000} from "../../utils/time";
import ServerChatAiMsg from "./ServerChatAiMsg";
import ServerChatMsgStorage from "./ServerChatMsgStorage";
import {ReportChatGptAiTaskType} from "../../types";
import TaskTable from "../models/rdms/TaskTable";

export default class ServerChatAiTask extends BaseObject{
  constructor(session:ServerSession) {
    super(session)
  }
  async fetchTask(){
    const tasks = await new TaskTable().fetchTask(1);
    return {
      tasks
    }
  }

  async reportTask({id,chatId,userId,msgId,text,isDone}:ReportChatGptAiTaskType){

    if(id){
      const msgDate = currentTs1000()/1000
      await new TaskTable().update({
        id,
        msgId,
        userId,
        isDone,
        msgDate
      })

      const session = this.getSession();
      session.setUserId(userId)
      if(isDone){
        await new ServerChatAiMsg(session,"0").cancelIsAsking()
      }
      await new ServerChatMsgStorage(this.getSession(),chatId.toString()).updateMessage({
        text,
        msgId,
        msgDate,
      })
    }
    return {
      status:200
    }
  }

  async checkTask(payload:{chatId:string,msgId:number,msgDate:number}) {
    const {id,msgDate,isDone} = await new TaskTable().getRowByUserIdAndMsgID(this.getSession().getUserId()!,payload.msgId) || {}
    if(id){
      if((msgDate && msgDate > payload.msgDate) || isDone){
        const updateMessage = await new ServerChatMsgStorage(this.getSession(),payload.chatId).getRow(payload.msgId)
        if(isDone){
          await new ServerChatAiMsg(this.getSession(),payload.chatId).cancelIsAsking();
          await new ServerChatAiMsg(this.getSession(),payload.chatId).finishChatGptReply({msgId:payload.msgId});
        }
        return {
          isDone:isDone,
          updateMessage
        }
      }else{
        return {
          id
        }
      }
    }
    return {
      status:500,
      errorMsg:"no task valid!"
    }
  }
}
