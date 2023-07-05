import { GetFileDataType, SaveFileDataType } from '../../types';
import BigStorage from '../../worker/services/storage/BigStorage';
import MainWindowManager from '../../ui/MainWindowManager';
import { sleep } from '../../utils/utils';
import MasterWindowCallbackAction from './MasterWindowCallbackAction';

export default class MasterActions{
  static async saveFileDate({filePath,type,content}:SaveFileDataType){
    filePath = filePath.replace(/_/g,"/")
    console.log("[saveFileDate]",{filePath})
    switch (type){
      case "hex":
        await BigStorage.getInstance().put(filePath,Buffer.from(content,"hex"))
        break
      case "base64":
        await BigStorage.getInstance().put(filePath,Buffer.from(content,"base64"))
        break
      case "string":
        await BigStorage.getInstance().put(filePath,content)
        break
    }
  }

  static async getFileDate({filePath,type}:GetFileDataType){
    if(
      filePath.startsWith("photo")
      && filePath.indexOf("?size=") > -1
      && filePath.indexOf("_") > -1
    ){
      //photo1_GM_DL4_XIxKH0LBjhA?size=c
      filePath = filePath.split("?")[1].replace("photo","").replace(/_/g,"/")
    }
    if(
      (filePath.startsWith("avatar") || filePath.startsWith("profile"))
      && filePath.indexOf("?") > -1
      && filePath.indexOf("_") > -1
    ){
      //avatar20006?1_GM_DL4_XIxKH0LBjhA
      filePath = filePath.split("?")[1].replace(/_/g,"/")
    }
    if(
      filePath.startsWith("msg")
      && filePath.indexOf("-") > -1
      && filePath.indexOf(":") > -1
      && filePath.indexOf("_") > -1
    ){
      if(filePath.indexOf("?size=") === -1){
        //msg20006-2458:20006_8n_3rw_pRA1u3IqSou
        filePath = filePath.split(":")[1].replace(/_/g,"/")
      }else{
        //msg20006-2458:20006_8n_3rw_pRA1u3IqSou?size=m
        filePath = filePath.split(":")[1].replace(/_/g,"/").split("?")[0]
      }
    }
    console.log("[getFileDate]",{filePath})
    const content = await BigStorage.getInstance().get(filePath)
    switch (type){
      case "buffer":
        return Buffer.from(content)
      case "base64":
      case "string":
        return Buffer.from(content).toString()
      case "hex":
        return Buffer.from(content).toString("hex")
    }
  }
  static async restartWorkerWindow(botId:string){
    if(MainWindowManager.getInstance(botId) && MainWindowManager.getInstance(botId).getMainWindowWebContents()){
      MainWindowManager.getInstance(botId).getMainWindow().close()
    }
    await sleep(1000)
    await new MasterWindowCallbackAction().openWorkerWindow(botId)
  }
}
