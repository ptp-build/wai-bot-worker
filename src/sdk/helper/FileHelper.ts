import BridgeMasterWindow from '../bridge/BridgeMasterWindow';

export default class FileHelper{
  private readonly botId: string;
  constructor(botId:string) {
    this.botId = botId
  }

  genId(length:number){
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return `${this.botId}_${result.substring(0,2)}_${result.substring(2,5)}_${result.substring(5)}`;
  }
  async save(content:string){
    const id = this.genId(16)
    await new BridgeMasterWindow(this.botId).saveFileData({
      filePath:id,
      content,
      type:'string'
    })
    return id
  }
}
