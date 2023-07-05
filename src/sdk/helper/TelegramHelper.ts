import FileHelper from './FileHelper';
import BridgeMasterWindow from '../bridge/BridgeMasterWindow';
import Html5CacheHelper from './Html5CacheHelper';
import { arrayBufferToBase64 } from '../common/buf';

export default class TelegramHelper{
  getCurrentChatId(){
    return location.href.split("#").length > 1 ? location.href.split("#")[1] : null;
  }
  isReady(){
    const global = this.getGlobal()
    return !!global
  }
  getGlobal(){
    return JSON.parse(localStorage.getItem("tt-global-state") || "{}")
  }
  async savePhoto(chatId:string,newChatId:string){
    const chat = this.selectChat(chatId)
    const {content,id} = chat.lastMessage
    const {photo} = content
    let data = await this.getMsgDocumentPhotoBase64data(chatId,id,photo.id,"x")
    if(!data.content){
      data = await this.getMsgDocumentPhotoBase64data(chatId,id,photo.id,"m")
    }
    if(data.content){
      const newId = await new FileHelper(newChatId).save(data.content)
      return {
        ...content,
        photo:{
          ...content.photo,
          id:newId
        }
      }
    }else{
      return null
    }
  }
  async saveVoice(chatId:string,newChatId:string){
    const chat = this.selectChat(chatId)
    const {content,id} = chat.lastMessage
    const {voice} = content
    let data = await this.getMsgVoiceBase64data(chatId,id,voice.id,)
    if(data.content){
      const newId = await new FileHelper(newChatId).save(data.content)
      return {
        ...content,
        voice:{
          ...content.voice,
          id:newId
        }
      }
    }else{
      return null
    }
  }
  async saveMessageContent(chatId:string,newChatId:string,msg:any){
    let content = msg.content
    if(msg.content.document){
      content = await this.saveDocument(chatId,newChatId)
    }else if(msg.content.photo){
      content = await this.savePhoto(chatId,newChatId)
    }else if(msg.content.voice){
      content = await this.saveVoice(chatId,newChatId)
    }else{
      content = msg.content
    }
    return content
  }
  async saveDocument(chatId:string,newChatId:string){
    const chat = this.selectChat(chatId)
    const {content,id} = chat.lastMessage
    const {document} = content
    const data = await this.getMsgDocumentBase64data(chatId,id,document.id)
    if(data.content){
      const newId = await new FileHelper(newChatId).save(data.content)
      return {
        ...content,
        document:{
          ...content.document,
          id:newId
        }
      }
    }else{
      return null
    }
  }
  selectChatMessages(chaId:string){
    const global = this.getGlobal()
    return global.messages.byChatId[chaId]
  }
  selectChatMessage(chaId:string,msgId:number){
    const messages = this.selectChatMessages(chaId);
    return messages.byId[msgId]
  }
  selectChats(){
    const global = this.getGlobal()
    if(global && global.chats.byId){
      const chats = global.chats.byId;
      return Object.keys(chats).map(chatId=>{
        return chats[chatId]
      })
    }else{
      return []
    }
  }

  async saveUserAvatar(userId:string){
    for (const type of ["avatar", "photo", "profile"]) {
      const avatarData = await this.getUserAvatarBase64Data(userId,type)
      await new BridgeMasterWindow().saveFileData({
        filePath:avatarData.url,
        content:avatarData.content,
        type:'string'
      })
    }
  }

  getMsgDocumentUrl(chatId:string,msgId:number,fileId:string){
    return `msg${chatId}-${msgId}_${fileId}`
  }

  getMsgDocumentPhotoUrl(chatId:string,msgId:number,fileId:string,size:"m" | 'x' = "m"){
    return `msg${chatId}-${msgId}_${fileId}?size=${size}`
  }

  getMsgVoiceUrl(chatId:string,msgId:number,fileId:string,end:number){
    return `progressive/msg${chatId}-${msgId}:${fileId}?start=0&end=${end}&type=arrayBuffer`
  }

  async getMsgDocumentPhotoBase64data(chatId: string, msgId:number,fileId:string,size:"m" | 'x' = "m") {
    const url = this.getMsgDocumentPhotoUrl(chatId,msgId,fileId,size)
    const cacheName = 'tt-media'
    const response = await new Html5CacheHelper().init(cacheName).get("/a/"+url)
    return {
      content:await arrayBufferToBase64(await response!.arrayBuffer(),response!.headers.get("content-type")!) as string,
      url,
    }
  }

  async getMsgVoiceBase64data(chatId: string, msgId:number,fileId:string,end:number = 524287) {
    const url = this.getMsgVoiceUrl(chatId,msgId,fileId,end)
    const cacheName = 'tt-media-progressive'
    const response = await new Html5CacheHelper().init(cacheName).get("/a/"+url)
    return {
      content:await arrayBufferToBase64(await response!.arrayBuffer(),response!.headers.get("content-type")!) as string,
      url,
    }
  }

  async getMsgDocumentBase64data(chatId: string, msgId:number,fileId:string) {
    const url = this.getMsgDocumentUrl(chatId,msgId,fileId)
    const cacheName = 'tt-media'
    const response = await new Html5CacheHelper().init(cacheName).get("/a/"+url)
    return {
      content:response ? await arrayBufferToBase64(await response!.arrayBuffer(),response!.headers.get("content-type")!) as string : null,
      url,
    }
  }

  getAvatarUrl(userId:string,avatarHash:string,type:string){
    let url = "";
    switch (type){
      case "avatar": //160 * 160
      case "profile": //640 * 640
        url = `${type}${userId}?${avatarHash}`
        break
      case "photo"://640 * 640
        url = `${type}${avatarHash}?size=c`
        break
    }
    return url
  }
  async getUserAvatarBase64Data(userId: string, type: string) {
    const user = this.selectUser(userId)
    let url = this.getAvatarUrl(userId,user.avatarHash,type);
    let cacheName = "";

    switch (type){
      case "avatar":
        cacheName = "tt-media-avatars";
        break
      case "profile":
      case "photo"://640 * 640
        cacheName = 'tt-media'
        break
    }
    const response = await new Html5CacheHelper().init(cacheName).get("/a/"+url)
    return {
      content:await arrayBufferToBase64(await response!.arrayBuffer(),response!.headers.get("content-type")!) as string,
      url,
    }
  }
  selectUser(userId:string) {
    const global = this.getGlobal()
    return global.users.byId[userId]
  }
  selectUserFullInfo(userId:string) {
    const global = this.getGlobal()
    return global.users.fullInfoById[userId]
  }
  selectChat(chatId:string) {
    const global = this.getGlobal()
    return global.chats.byId[chatId]
  }
  selectChatPhones(chatId:string) {
    const chat = this.selectChat(chatId)
    return chat.photos[0]
  }
  selectUserPhones(userId:string) {
    const user = this.selectUser(userId)
    return user.photos[0]
  }
}
