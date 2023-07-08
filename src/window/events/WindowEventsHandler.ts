import { MasterEventActions, MasterEvents } from '../../sdk/types';
import RenderChatMsg from '../../render/RenderChatMsg';
import { getMasterWindowWebContent } from '../../ui/window';
import ChatAiMsg from '../ChatAiMsg';
import MainChatMsgStorage from '../MainChatMsgStorage';
import BotWorkerStatus from '../../sdk/botWorkerStatus/BotWorkerStatus';

export default class WindowEventsHandler {

  private static async handleNewMessageAction(payload: any) {
    const mainChatMsgStorage = new MainChatMsgStorage();
    if(!payload.newMessage.msgId){
      payload.newMessage.msgId = await new RenderChatMsg(payload.newMessage.chatId).genMsgId();
    }
    await mainChatMsgStorage.addNewMessage(payload.newMessage)
    console.log("[handleNewMessageAction]",payload)
    if(payload.newMessage.isOutgoing){
      if(!payload.sendToMainChat){
        return
      }
    }
    return payload.newMessage.msgId;
  }

  static async sendEventToMasterChat(action:MasterEventActions,payload?:any){
    let res;
    switch (action){
      case MasterEventActions.UpdateWorkerStatus:
        BotWorkerStatus.update(payload);
        break
      case MasterEventActions.FinishChatGptReply:
        void await new ChatAiMsg(payload.chatId).finishChatGptReply(payload)
        break
      case MasterEventActions.DeleteMessages:
        void await new MainChatMsgStorage().deleteMessages(payload.chatId,payload.ids)
        break
      case MasterEventActions.NewContentMessage:
      case MasterEventActions.NewMessage:
        res = await WindowEventsHandler.handleNewMessageAction(payload);
        if(!res){
          return
        }
        break
      case MasterEventActions.UpdateMessage:
        void await new MainChatMsgStorage().updateMessage(payload.updateMessage)
        break
    }

    if(getMasterWindowWebContent()){
      getMasterWindowWebContent()!.send(MasterEvents.Master_Chat_Msg, action, payload);
    }
    return res
  }

  static async replyChatMsg(text:string,chatId:string,inlineButtons?:any[]){
    const msgId = await new RenderChatMsg(chatId).genMsgId();
    return await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.NewMessage,{
      newMessage:{
        text,
        msgId,
        chatId,
        inlineButtons
      }
    })
  }
}
