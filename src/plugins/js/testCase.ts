import { sleep } from './common/helper';
import BaseWorkerMsg from './common/BaseWorkerMsg';
import { LocalWorkerAccountType } from '../../types';

class TestCase extends BaseWorkerMsg{
  constructor(botId:string) {
    super(botId);
    console.log("[TestCase] load!!")
  }
  async testTgInput(botId:string){
    const input = document.getElementById('telegram-search-input');
    // @ts-ignore
    input!.value = "aaaaaaaaaaaaa"
    this.botId  = botId
    await this.sendMouseEvent("left","mouseDown",100,20)
    await this.sendSpaceKeyboardEvent()
    await this.sendMouseEvent("left","mouseDown",120,20)
    await this.sendSpaceKeyboardEvent()
  }
  async testKeyboardEvent(botId:string){
    const input = document.createElement('input');
    input.id = 'myInput';
    input.style.position = "fixed"
    input.style.top = "0"
    input.style.left = "0"
    input.style.zIndex = "1000000000"
    input.style.height = "40px"
    input.style.width = "100px"
    const val = input.value
    input.value = "aaaaaaaaaaaaaa"
    document.body.appendChild(input);
    this.botId = botId
    await this.sendMouseEvent("left","mouseDown",20,20)
    await this.sendSpaceKeyboardEvent()
    await this.sendMouseEvent("left","mouseDown",60,20)
    await this.sendSpaceKeyboardEvent()
  }
  async testScrollDown(testMsg:string,loopLen:number){
    let text = testMsg
    const msgId = await this.replyMessage(text,[],this.botId)
    for (let i = 0; i < loopLen; i++) {
      await sleep(600)
      text += ", " +testMsg
      await this.updateMessage(text,msgId! as number,this.botId)
    }
  }

  testReplyParse(){
    const code = 'return JSON.parse(result).reply;';
    const func = new Function('result', code);
    const result = func('{"reply":"test"}');
    console.log(result);
  }
}
const {WORKER_ACCOUNT} = window
const workerAccount = WORKER_ACCOUNT as LocalWorkerAccountType

window['TestCase'] = new TestCase(workerAccount.botId)
