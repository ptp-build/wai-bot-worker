import { getFileContent, putFileContent } from '../worker/share/db/LocalFileKv';

jest.setTimeout(100000)

let tempTexts = ""
let tempLastText = ""
let sendIndex = 0

function onData(chunk: string,index:number) {
  tempTexts += chunk;
  const dataText = "\n\n"+tempTexts.trim()
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
    const text = text1.replace(tempLastText,"")
    tempLastText = text1

    sendIndex += 1
    if(isDone){
      console.log("[onData] #" + sendIndex,"DONE",tempLastText)
      // ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_DONE, sendIndex+"_"+tempLastText);
      sendIndex = 0
    }else{
      console.log("[onData] #" + sendIndex,"GOING",text)
      // ChatGptWaiChatBot.reply(ChatGptStreamStatus.ChatGptStreamStatus_GOING, sendIndex+"_"+text);
    }
  }catch (e){
    // putFileContent(`/tmp/test/${index}`,chunk).then(console.log).catch(console.error)
    console.log("[onData] #" + index,"EROR")
  }
}

describe('ChatGptMsg', function() {
  it('should parse ok', async function() {
    const n = 52
    for (let i = 1; i <= n; i++) {
      const content = await getFileContent("/tmp/test/"+i)
      onData(content!,i)
    }
  });
});
