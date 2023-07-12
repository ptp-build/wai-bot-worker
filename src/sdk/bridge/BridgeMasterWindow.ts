import Bridge from './Bridge';
import { GetFileDataType, MasterEventActions, SaveFileDataType } from '../types';

export default class BridgeMasterWindow extends Bridge{
  constructor(botId?:string) {
    super(botId);
  }
  saveFileData(payload:SaveFileDataType){
    return this.invokeMasterWindowAction(MasterEventActions.SaveFileData, payload);
  }
  getFileData(payload:GetFileDataType){
    return this.invokeMasterWindowAction(MasterEventActions.GetFileData, payload);
  }
  closeWorkerWindow(payload: { botId:string }){
    return this.invokeMasterWindowAction(MasterEventActions.CloseWorkerWindow, payload);
  }
  restartWorkerWindow(payload: { botId:string }){
    return this.invokeMasterWindowAction(MasterEventActions.RestartWorkerWindow, payload);
  }
  requestOpenAi(payload: any ){
    return this.invokeMasterWindowAction(MasterEventActions.RequestOpenAi, payload);
  }
  getWorkersStatus(){
    return this.invokeMasterWindowAction(MasterEventActions.GetWorkersStatus);
  }
  updateWorkerStatus(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.UpdateWorkerStatus, payload);
  }
  updateMessage(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.UpdateMessage, payload);
  }
  finishChatGptReply(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.FinishChatGptReply, payload);
  }
  updateUserInfo(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.UpdateUserInfo, payload);
  }
  newContentMessage(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.NewContentMessage, payload);
  }
  newMessage(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.NewMessage, payload);
  }

  newMessageByTaskWorker(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.NewMessageByTaskWorker, payload);
  }
  deleteMessages(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.DeleteMessages, payload);
  }

  getWorkerAccount(payload:any){
    return this.invokeMasterWindowAction(MasterEventActions.GetWorkerAccount, payload);
  }

  getWorkerAccounts(payload?:any){
    return this.invokeMasterWindowAction(MasterEventActions.GetWorkerAccounts, payload);
  }

  createWorker(payload?:any){
    return this.invokeMasterWindowAction(MasterEventActions.CreateWorker, payload);
  }

  applyMsgId(chatId:string){
    return this.invokeMasterWindowAction(MasterEventActions.ApplyMsgId, {chatId});
  }
}
