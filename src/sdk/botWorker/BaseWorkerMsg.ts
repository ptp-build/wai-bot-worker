import { CallbackButtonAction, ApiChatMsg } from '../types';
import BaseKeyboardAndMouseEvents from './BaseKeyboardAndMouseEvents';
import FileHelper from '../helper/FileHelper';
import { arrayBufferToBase64 } from '../common/buf';
import BridgeRender from '../bridge/BridgeRender';
import BridgeMasterWindow from '../bridge/BridgeMasterWindow';
import MsgHelper from '../helper/MsgHelper';
import { currentTs } from '../common/time';

interface Icon {
  rel: string;
  url: string;
  width?: number;
  height?: number;
}

interface Meta {
  name?: string;
  property?: string;
  content: string;
}

interface Logo {
  width?: number;
  height?: number;
  url?: string;
  dataUri?: string;
}

export interface SiteInfo {
  icons: Icon[];
  meta: Meta[];
  logo?: Logo;
}

export default class BaseWorkerMsg extends BaseKeyboardAndMouseEvents{

  constructor(botId: string) {
    super(botId)
  }

  updateUserInfo(userId:string,user:{photos:any[],avatarHash:string}) {
    void this.getBridgeMasterWindow().updateUserInfo({
      userId,
      user,
    })
  }

  isLogoUpdated(){
    return localStorage.getItem("updateSiteLogo2_"+this.botId)
  }

  logoUpdated(){
    return localStorage.setItem("updateSiteLogo2_"+this.botId,"1")
  }

  async updateSiteLogo(botId:string,logoUrl:string){
    if(this.isLogoUpdated()){
      return false
    }
    let logoData;
    if(logoUrl.startsWith('http')){
      logoData = await this.fetchSiteLogo(logoUrl) as string
    }else{
      logoData = logoUrl
    }
    if(logoData){
      const avatarHash = await new FileHelper(this.botId).save(logoData)
      this.updateUserInfo(botId,{
        avatarHash,
        photos:[
          {
            id:avatarHash,
          }
        ]
      })
      this.logoUpdated()
      return true;
    }
    return false
  }

  loadUrl(url:string){
    return this.getBridgeWorkerWindow().loadUrl({url})
  }

  getSiteInfo(): SiteInfo {
    const links = document.getElementsByTagName("link");
    const icons: Icon[] = [];
    let logo: Logo | undefined;
    let iconData: string | undefined;

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      if (link && link.rel && link.rel.includes("icon")) {
        let width: number | undefined, height: number | undefined;

        if (link.sizes[0]) {
          const size = link.sizes[0].split("x");
          if (size.length > 0) {
            width = Number(size[0]);
            height = Number(size[1]);
          }
        }

        if (link.href.startsWith("data:image/")){
          iconData = link.href;
        }

        if (link.rel.includes("apple-touch-icon") && height && height >= 144) {
          logo = {
            width: width,
            height: height,
            url: link.href
          };
        }

        icons.push({
          rel: link.rel,
          url: link.href,
          width: width,
          height: height
        });
      }
    }

    if (!logo && iconData) {
      logo = {
        dataUri: iconData
      };
    }

    if (!logo) {
      icons.forEach(icon=>{
        if(icon.width){
          logo = {
            width: icon.width,
            height:icon. height,
            url: icon.url
          };
        }
      })

    }
    const metas1 = document.getElementsByTagName("meta");
    const metas: Meta[] = [];

    for (let i = 0; i < metas1.length; i++) {
      const meta = metas1[i];
      if (meta && meta.getAttribute("content") && (meta.getAttribute("name") || meta.getAttribute("property"))) {
        metas.push({
          name: meta.getAttribute("name") || undefined,
          property: meta.getAttribute("property") || undefined,
          content: meta.getAttribute("content") as string
        });
      }
    }

    return {
      icons: icons,
      meta: metas,
      logo: logo
    };
  }

  async fetchSiteLogo(url:string){
    try {
      const res = await fetch(url)
      const data = await res.arrayBuffer();
      return await arrayBufferToBase64(data,res.headers.get("content-type")|| "image/png")
    }catch (e){
      return null
    }
  }

  async applyMsgId(chatId:string){
    const {msgId} = await new BridgeMasterWindow().applyMsgId(chatId)
    return msgId
  }

  replyUpdateMessage(msgId: number, chatId: string,message:Partial<ApiChatMsg>) {
    return this.getBridgeMasterWindow().updateMessage({
      updateMessage: message,
    })
  }

  updateMessage(text1: string, msgId: number, chatId: string,fromBotId?:string,taskId?:number,isDone?:boolean) {
    void this.getBridgeMasterWindow().updateMessage({
      updateMessage: {
        msgId,
        chatId,
        text:text1,
        entities:[]
      },
    })
    if(fromBotId && taskId){
      void this.getBridgeWorkerWindow().taskAiMsg({
        fromBotId,
        taskId,
        isDone,
        updateMessage: {
          msgId,
          chatId,
          text:text1,
          entities:[]
        },
      })
    }
  }

  finishReply(msgId:number,chatId:string) {
    void this.getBridgeMasterWindow().finishChatGptReply({
      msgId,
      chatId
    })
  }

  replyTextWithCancel(text: string, inlineButtons?: any[],chatId?:string) {
    if (!inlineButtons) {
      inlineButtons = [];
    }
    inlineButtons.push([
      {
        text: '↩️️ Cancel',
        data: CallbackButtonAction.Local_cancelMessage,
        type: 'callback',
      },
    ]);
    return this.replyMessage(text, inlineButtons,chatId);
  }

  replyJsonCancel(json: any, inlineButtons?: any[]) {
    return this.replyTextWithCancel("```json\n"+JSON.stringify(json,null,2)+"```",inlineButtons)
  }

  replyMessageWithCancel(content: any, inlineButtons?: any[]) {
    if (!inlineButtons) {
      inlineButtons = [];
    }
    inlineButtons.push([
      {
        text: '↩️️ Cancel',
        data: CallbackButtonAction.Local_cancelMessage,
        type: 'callback',
      },
    ]);
    return this.getBridgeMasterWindow().newContentMessage({
      newMessage: {
        chatId: this.botId,
        content,
        isOutgoing:false,
        inlineButtons: inlineButtons || undefined,
      },
    })
  }

  replyMessage(text: string, inlineButtons?: any[], chatId?: string,isOutgoing?:boolean,senderId?:string,sendToMainChat?:boolean) {
    return this.getBridgeMasterWindow().newMessage({
      sendToMainChat,
      newMessage: {
        chatId:chatId || this.botId,
        text,
        senderId:this.botId,
        isOutgoing:!!isOutgoing,
        inlineButtons: inlineButtons || undefined,
      },
    })
  }

  askMessageByTaskWorker(text: string,taskId:number) {
    return this.getBridgeMasterWindow().newMessageByTaskWorker({
      newMessage: {
        chatId: this.botId,
        text,
      },
      taskId
    })
  }

  waitForElement(selector:string, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else {
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= timeout) {
            reject(new Error(`Timeout exceeded (${timeout}ms) while waiting for element: ${selector}`));
          } else {
            setTimeout(checkElement, 500);
          }
        }
      };
      checkElement();
    });
  }

  async replyJsonFile(name:string,json:any){
    const fileData = JSON.stringify(json,null,2)
    await this.replyMessageTextDoc(
      this.botId,name,fileData,fileData.length,"application/json",
      "plainData\r\n",
      [
        MsgHelper.buildOpenDocBtn()
      ]
    )
  }
  async replyMessageTextDoc(chatId:string,fileName:string,fileData:string,size:number,mimeType:string,type:"plainData\r\n"|"base64" = "base64",inlineButtons?:any[][]){
    if(type === 'base64'){
      await this.replyMessageDoc(chatId,fileName,"data:"+mimeType+";"+type+","+btoa(unescape(encodeURIComponent(fileData))),size,mimeType,inlineButtons)
    }else{
      await this.replyMessageDoc(chatId,fileName,"data:"+mimeType+";"+type+fileData,size,mimeType,inlineButtons)
    }
  }
  async replyMessageDoc(chatId:string,fileName:string,fileData:string,size:number,mimeType:string,inlineButtons?:any[][]){
    const id = await new FileHelper(chatId).save(fileData)
    return this.replyMessageWithCancel({
      document:{
        id,
        fileName,
        size:fileData.length,
        mimeType,
        timestamp:currentTs()
      }
    },inlineButtons)
  }

  async updateMsg(msg:ApiChatMsg){
    return this.getBridgeMasterWindow().updateMessage({
      updateMessage:msg,
    })
  }
  async replyMsg(msg:ApiChatMsg,options?:{withCancelButton?:boolean}){
    const {withCancelButton} = options || {}
    let {msgId,content,text,chatId,msgDate,senderId,inlineButtons} = msg;
    if(!senderId){
      senderId = this.botId
    }
    if(!msgDate){
      msgDate = currentTs()
    }
    if(!inlineButtons){
      inlineButtons = []
    }
    if(withCancelButton){
      inlineButtons.push(MsgHelper.buildLocalCancel())
    }
    const newMessage = {
      chatId,
      msgId,
      msgDate,
      text:text || "",
      senderId,
      content:content || undefined,
      isOutgoing:false,
      inlineButtons,
    }
    await this.getBridgeMasterWindow().newMessage({
      sendToMainChat:true,
      newMessage ,
    })
    return newMessage
  }
}
