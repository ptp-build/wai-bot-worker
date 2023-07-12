import {
  GetFileDataType, LocalWorkerAccountType,
  LocalWorkerBotType,
  MasterEventActions,
  SaveFileDataType,
  WindowActions,
} from '../../sdk/types';
import BigStorage from '../../worker/services/storage/BigStorage';
import MainWindowManager from '../../ui/MainWindowManager';
import MasterWindowCallbackAction from './MasterWindowCallbackAction';
import { sleep } from '../../sdk/common/time';
import { createParser } from 'eventsource-parser';
import WindowEventsHandler from './WindowEventsHandler';
import MsgHelper from '../../sdk/helper/MsgHelper';

export default class MasterActions{
  static async saveFileDate({filePath,type,content}:SaveFileDataType){
    filePath = filePath.replace(/_/g,"/")
    // console.log("[saveFileDate]",{filePath})
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
  static getFilePath(filePath:string){
    if(
      filePath.startsWith("photo")
      && filePath.indexOf("?size=") > -1
      && filePath.indexOf("_") > -1
    ){
      //photo1001_GM_DL4_XIxKH0LBjhA?size=c
      filePath = filePath.split("?")[0].replace("photo","").replace(/_/g,"/")
    } else if(
      (filePath.startsWith("avatar") || filePath.startsWith("profile"))
      && filePath.indexOf("?") > -1
      && filePath.indexOf("_") > -1
    ){
      //avatar20006?1_GM_DL4_XIxKH0LBjhA
      filePath = filePath.split("?")[1].replace(/_/g,"/")
    } else if(
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
    }else{
      filePath = filePath.replace(/_/g,"/")
    }
    console.debug("[filePath]",filePath)
    return filePath
  }
  static async getFileDate({filePath,type}:GetFileDataType){
    filePath = MasterActions.getFilePath(filePath)
    // console.log("[getFileDate]",{filePath})
    const content = await BigStorage.getInstance().get(filePath)
    if(!content){
      return undefined
    }
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

  static async requestOpenAi(payload:any){
    const {openAiApiKey,body,chatId,msgId,account} = payload;
    try{
      console.debug("[requestOpenAi]",msgId)
      const res = await fetch(`https://api.openai.com/v1/chat/completions`, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Authorization': `Bearer ${openAiApiKey}`,
        },
        method:"POST",
        body:JSON.stringify(body),
      });
      console.debug("[requestOpenAi response]",res.ok)
      if(!res.ok){
        const json = await res.json()
        await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateMessage,{
          skipSaveDb:true,
          updateMessage:{
            chatId,msgId,text:MsgHelper.formatCodeTextMsg(JSON.stringify(json,null,2))
          }
        })
        return
      }

      const textEncoder = new TextEncoder();
      const textDecoder = new TextDecoder();
      return new ReadableStream({
        async cancel(reason) {
          console.warn(reason);
        },

        async start(controller) {
          let text = ""
          let token_len = 0
          const onParse = (event: any) => {
            // console.log(event);
            if (event.type === 'event') {
              try {
                const data = event.data;
                if (data === '[DONE]') {
                  controller.close();
                  console.debug("[DONE]",text)
                  let {replyParser} = account as LocalWorkerAccountType
                  if(replyParser && replyParser){
                    replyParser = replyParser?.trim()
                    text = MsgHelper.handleReplyText(text,replyParser)
                  }
                  if(text){
                    void WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateMessage,{
                      updateMessage:{
                        chatId,msgId,text
                      }
                    })
                  }
                  return;
                }
                const json = JSON.parse(data);
                const c = json.choices[0].delta.content
                if(c){
                  // token_len += encode(c).length
                  // console.log("token",c,encode(c),encode(c).length,token_len)
                  text += c;
                }
                const queue = textEncoder.encode(c);
                controller.enqueue(queue);
                if(text){
                  void WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateMessage,{
                    skipSaveDb:true,
                    updateMessage:{
                      chatId,msgId,text
                    }
                  })
                }
              } catch (e) {
                console.error("[ERROR onParse ]",e)
              }
            }
          }
          try {
            const parser = createParser(onParse);
            // @ts-ignore
            for await (const chunk of await res.body as any) {
              const chunkDecode = textDecoder.decode(chunk);
              // console.log(chunkDecode)
              if (chunkDecode) {
                parser.feed(chunkDecode);
              }
            }
          }catch (e){
            console.error("[ERROR onStart ]",e)
          }
        },
      });
    }catch (e:any){
      console.error("[ERROR onRequest]",e)
      await WindowEventsHandler.sendEventToMasterChat(MasterEventActions.UpdateMessage,{
        updateMessage:{
          chatId,msgId,text:"Invoke api Error:" + e.message
        }
      })
    }

  }
  static async closeWorkerWindow(botId:string){
    await new MasterWindowCallbackAction().closeWorkerWindow(botId)
  }
  static async restartWorkerWindow(botId:string){
    if(MainWindowManager.getMainWindowWebContents(botId)){
      MainWindowManager.getMainWindowWebContents(botId)!.close()
    }
    await sleep(1000)
    await new MasterWindowCallbackAction().openWorkerWindow(botId)
  }
}
