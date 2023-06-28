import {MasterEventActions, MasterEvents, WorkerEventActions, WorkerEvents} from "../../types";
import MainWindowManager from "../../ui/MainWindowManager";
import RenderChatMsg from "../../render/RenderChatMsg";
import {getMasterWindow} from "../../ui/window";
import ChatAiMsg from "../ChatAiMsg";
import MainChatMsgStorage from "../MainChatMsgStorage";

export default class WindowEventsHandler {
  static async sendEventToMasterChat(action:MasterEventActions,payload?:any){
    const mainChatMsgStorage = new MainChatMsgStorage();
    switch (action){
      case MasterEventActions.FinishChatGptReply:
        void await new ChatAiMsg(payload.chatId).finishChatGptReply(payload)
        break
      case MasterEventActions.DeleteMessages:
        void await mainChatMsgStorage.deleteMessages(payload.chatId,payload.ids)
        break
      case MasterEventActions.NewMessage:
        if(!payload.newMessage.msgId){
          payload.newMessage.msgId = await new RenderChatMsg(payload.newMessage.chatId).genMsgId();
        }
        void await mainChatMsgStorage.addNewMessage(payload.newMessage)
        if(payload.newMessage.isOutgoing){
          return
        }
        break
      case MasterEventActions.UpdateMessage:
        void await mainChatMsgStorage.updateMessage(payload.updateMessage)
        break
    }

    if(getMasterWindow() && getMasterWindow()?.webContents){
      return getMasterWindow()
        ?.webContents
        .send(MasterEvents.Master_Chat_Msg, action, payload);
    }
  }

  static async replyChatMsg(text:string,chatId:string){
    const msgId = await new RenderChatMsg(chatId).genMsgId();
    await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.NewMessage,{
      newMessage:{
        text,
        msgId,
        chatId
      }
    })
  }
  static sendEventToWorker(botId:string,action:WorkerEventActions,payload?:any){
    if(
      MainWindowManager.getInstance(botId) &&
      MainWindowManager.getInstance(botId).getMainWindow() &&
      MainWindowManager.getInstance(botId).getMainWindow().webContents
    ){
      return MainWindowManager.getInstance(botId)
        ?.getMainWindow().webContents
        .send(WorkerEvents.Worker_Chat_Msg, action, payload);
    }
  }
}
