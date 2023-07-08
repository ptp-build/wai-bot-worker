import { CallbackButtonAction, ApiChatMsg } from '../types';
import BaseKeyboardAndMouseEvents from './BaseKeyboardAndMouseEvents';
import FileHelper from '../helper/FileHelper';
import { arrayBufferToBase64 } from '../common/buf';

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

  replyTextWithCancel(text: string, inlineButtons?: any[]) {
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
    return this.replyMessage(text, inlineButtons);
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
        isOutgoing:!!isOutgoing,
        inlineButtons: inlineButtons || undefined,
      },
    })
  }

  loadUrl(url:string){
    return this.getBridgeWorkerWindow().loadUrl({url})
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
}
