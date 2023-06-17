
export interface ParseDatResult{
  state:"ERROR" | "DONE" | "GOING",
  text:string
}
export default class ChatGptHelper{
  private tempTexts: string;
  private tempLastText: string;
  private sendIndex: number;
  constructor() {
    this.tempTexts = ""
    this.tempLastText = ""
    this.sendIndex = 0
  }
  parseOnData(chunk: string,index:number) :ParseDatResult{
    this.tempTexts += chunk;
    const dataText = "\n\n"+this.tempTexts.trim()
    const rows = dataText.split("\n\ndata: {\"message\": {\"id\":")
    let lastLine = rows[rows.length - 1]

    let isDone = false
    if(lastLine.endsWith("\n\ndata: [DONE]")){
      lastLine = lastLine.substring(0,lastLine.length - "\n\ndata: [DONE]".length )
      isDone = true
    }else{
      if(!lastLine.endsWith('"error": null}')){
        lastLine = rows[rows.length - 2]
      }
    }
    lastLine = "{\"message\": {\"id\":" + lastLine
    try{
      const res = JSON.parse(lastLine)
      const text1 = res.message.content.parts[0];
      const text = text1.replace(this.tempLastText,"")
      this.tempLastText = text1

      this.sendIndex += 1
      if(isDone){
        console.log("[onData] #" + this.sendIndex,"DONE",this.tempLastText)
        // ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_DONE, sendIndex+"_"+tempLastText);
        this.sendIndex = 0
        return {
          state:'DONE',
          text:this.sendIndex+"_"+this.tempLastText
        }
      }else{
        console.log("[onData] #" + this.sendIndex,"GOING",text)
        // ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_GOING, sendIndex+"_"+text);
        return {
          state:'GOING',
          text:this.sendIndex+"_"+text
        }
      }
    }catch (e){
      // putFileContent(`/tmp/test/${index}`,chunk).then(console.log).catch(console.error)
      console.log("[onData] #" + index,"EROR")
      return {
        state:'ERROR',
        text:"EROR"
      }
    }
  }
}
