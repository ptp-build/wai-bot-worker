import { CallbackButtonAction, CallbackButtonActionType } from '../types';
import { encodeCallBackButtonPayload } from '../common/string';

export default class MsgHelper {
  static isLocalMessageId(id:number){
    return !Number.isInteger(id);
  }
  static buildCommand(command:string,description:string,botId:string){
    return {
      command,
      botId,
      description
    }
  }
  static formatCodeTextMsg(text:string,lang:"" | "json" | "typescript" = "json"){
    return "```"+lang+"\n"+text+"```"
  }
  static buildLocalCancel(text?:string){
    return [
      MsgHelper.buildCallBackAction(text || "↩️️ Cancel",CallbackButtonAction.Local_cancelMessage),
    ]
  }
  static buildRenderCancel(text?:string,payload?:any){
    return [
      MsgHelper.buildCallBackAction(text || "↩️️ Cancel",encodeCallBackButtonPayload(CallbackButtonAction.Render_cancelMessage,payload)),
    ]
  }


  static buildOpenDocBtn(text?:string){
    return [
      MsgHelper.buildCallBackAction(text || "Open",encodeCallBackButtonPayload(CallbackButtonAction.Master_openMessageDoc,{
        openMessageDoc:true
      })),
    ]
  }
  static buildButtonAction(text:string,path:CallbackButtonActionType | string,type?:"unsupported" | "command" | "callback"){
    switch (type){
      case 'callback':
        return MsgHelper.buildCallBackAction(text,path)
      default:
        return {
          text,type
        }
    }
  }

  static buildUnsupportedAction(text?:string){
    return {
      text:text||"",
      type:"unsupported"
    }
  }

  static buildConfirmCallBackAction(text:string,path:CallbackButtonActionType | string,confirmText:string,payload?:any){
    return {
      text,
      data:`${encodeCallBackButtonPayload(path,{
        showConfirm:true,
        confirmText,
        ...(payload || {})
      })}`,
      type:"callback"
    }
  }
  static buildCallBackAction(text:string,path:CallbackButtonActionType | string,payload?:any){
    if(path){
      path = encodeCallBackButtonPayload(path,payload)
    }
    return {
      text,
      data:`${path}`,
      type:"callback"
    }
  }
  static isMasterWindowCallbackButtonAction(path:CallbackButtonActionType){
    return path.startsWith("Master_")
  }

  static isWorkerCallbackButtonAction(path:CallbackButtonActionType){
    return path.startsWith("Worker_")
  }
  static isLocalCallbackButtonAction(path:string){
    return path.startsWith("Local_")
  }

  static isRenderCallbackButtonAction(path:CallbackButtonActionType){
    return path.startsWith("Render_")
  }

}
