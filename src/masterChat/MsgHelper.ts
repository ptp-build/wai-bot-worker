import {CallbackButtonAction, CallbackButtonActionType} from "../types";

export default class MsgHelper {
  static buildCommand(command:string,description:string,botId:string){
    return {
      command,
      botId,
      description
    }
  }
  static buildCallBackAction(text:string,path:CallbackButtonActionType | string){
    return {
      text,
      data:`${path}`,
      type:"callback"
    }
  }
  static buildCancelCallBackAction(text:string){
    return {
      text,
      data:`${CallbackButtonAction.Local_cancelMessage}`,
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
