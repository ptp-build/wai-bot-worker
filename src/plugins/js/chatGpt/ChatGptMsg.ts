export default class ChatGptMsg {
  msgId: number;
  chatId: string;
  tempTexts: string = "";
  tempLastText: string = "";
  sendIndex: number = 0;
  fromBotId?: string;
  taskId?: number;

  constructor(msgId: number, chatId: string,fromBotId?:string,taskId?:number) {
    this.msgId = msgId;
    this.chatId = chatId;
    this.fromBotId = fromBotId;
    this.taskId = taskId;
  }

  parseOnData(chunk: string): { state: string; text: string } {
    this.tempTexts += chunk;
    const dataText = "\n\n" + this.tempTexts.trim();
    const rows = dataText.split("\n\ndata: {\"message\": {\"id\":");
    let lastLine = rows[rows.length - 1];

    let isDone = false;
    if (lastLine.endsWith("\n\ndata: [DONE]")) {
      lastLine = lastLine.substring(0, lastLine.length - "\n\ndata: [DONE]".length);
      isDone = true;
    } else {
      if (!lastLine.endsWith('"error": null}')) {
        lastLine = rows[rows.length - 2];
      }
    }
    lastLine = "{\"message\": {\"id\":" + lastLine;
    try {
      const res = JSON.parse(lastLine);
      const text1 = res.message.content.parts[0];
      const text = text1.replace(this.tempLastText, "");
      this.tempLastText = text1;
      this.sendIndex += 1;
      if (isDone) {
        this.sendIndex = 0;
        return {
          state: 'DONE',
          text: this.tempLastText
        };
      } else {
        return {
          state: 'GOING',
          text: this.tempLastText
        };
      }
    } catch (e) {
      return {
        state: 'ERROR',
        text: ""
      };
    }
  }
}
