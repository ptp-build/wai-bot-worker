import {ENV} from "../../../env";
import {JSON_HEADERS} from "../../../setting";

export class DoWebsocket{
    constructor() {
    }
    getHandler(){
        return ENV.DO_WEBSOCKET!.get(ENV.DO_WEBSOCKET!.idFromName('/ws'))
    }
    buildRequest(method:string,path:string,body?:Record<string, any>){
        method = method.toUpperCase()
        const url = 'https://wai.chat/api/do/ws/'+path
        console.log("[buildRequest]",url)
        return new Request(url, {
            method,
            headers:JSON_HEADERS ,
            body: body ? JSON.stringify(body) : undefined,
        });
    }
    async sendMsg({toUserId,fromUserId,text,chatId}:{toUserId:string,fromUserId:string,text:string,chatId:string}){
        const request =  this.buildRequest("POST","sendMessage",{
            toUserId,
            fromUserId,
            text,
            chatId,
        });
        const handler = this.getHandler();
        return handler.fetch(request)
    }

    async sendChatGptMsg(pduBuf:Buffer,chatId:string){
        const request =  this.buildRequest("POST","sendChatGptMsg",{
            pduBuf:pduBuf.toString("hex"),chatId
        });
        const handler = this.getHandler();
        return handler.fetch(request)
    }
    async sendBotMsgRes(pduBuf:Buffer,toUid:string){
        const request =  this.buildRequest("POST","sendBotMsgRes",{
            pduBuf:pduBuf.toString("hex"),toUid
        });
        const handler = this.getHandler();
        return handler.fetch(request)
    }
    async getAccounts(){
        const handler = this.getHandler();
        console.log("getAccounts")
        const res = await handler.fetch(this.buildRequest("GET","__accounts"))
        return await res.json();
    }
}
