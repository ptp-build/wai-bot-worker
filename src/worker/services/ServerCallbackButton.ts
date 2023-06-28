import {parseCallBackButtonPayload} from "../../utils/utils";
import {ServerCallbackButtonAction, ServerEventActions} from "../../types";
import {User} from "../models/user/User";
import BaseObject from "./BaseObject";
import ServerSession from "./ServerSession";
import ServerBotAccount from "./ServerBotAccount";

export default class ServerCallbackButton extends BaseObject{
  private path: string;
  private chatId: string;
  private messageId: number;
  private payload: any;
  constructor(session:ServerSession,data:string) {
    super(session)
    const {path,params} = parseCallBackButtonPayload(data)

    const {chatId,messageId,...payload} = params
    this.payload = payload;
    this.path = path
    this.messageId = messageId
    this.chatId = chatId
  }
  async Server_CreateChatGptBot(){
    const botId = await User.genUserId()
    await new ServerBotAccount(this.getSession(),botId).update({
      botId,
      type:'chatGpt'
    });

    return {
      eventAction:ServerEventActions.Local_CreateChatGptBot,
      eventPayload:{
        botId,
        type:'chatGpt'
      }
    }
  }
  async process(){
    const {path} = this
    console.log(path)
    switch (path){
      case ServerCallbackButtonAction.Server_CreateChatGptBot:
        return await this.Server_CreateChatGptBot()
    }
  }
}
