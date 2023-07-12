import BridgeWorkerWindow from '../bridge/BridgeWorkerWindow';
import BridgeMasterWindow from '../bridge/BridgeMasterWindow';
import BridgeRender from '../bridge/BridgeRender';
import { sleep } from '../common/time';

export default class BaseKeyboardAndMouseEvents{
  public botId: string;
  private readonly bridgeWorkerWindow: BridgeWorkerWindow;
  private readonly bridgeMasterWindow: BridgeMasterWindow;
  private readonly bridgeRender: BridgeRender;

  constructor(botId:string) {
    this.botId = botId
    this.bridgeWorkerWindow = new BridgeWorkerWindow(this.botId)
    this.bridgeMasterWindow = new BridgeMasterWindow(this.botId)
    this.bridgeRender= new BridgeRender(this.botId)
  }
  getBridgeWorkerWindow(){
    return this.bridgeWorkerWindow
  }

  getBridgeMasterWindow(){
    return this.bridgeMasterWindow
  }

  getBridgeRenderWindow(){
    return this.bridgeRender
  }

  sendKeyboardEvent(type: 'char' | 'keyUp' | 'keyDown', keyCode: string,modifiers?:Array<'shift' | 'control' | 'ctrl' | 'alt' | 'meta' | 'command' | 'cmd' | 'isKeypad' | 'isAutoRepeat' | 'leftButtonDown' | 'middleButtonDown' | 'rightButtonDown' | 'capsLock' | 'numLock' | 'left' | 'right'>) {
    return this.bridgeWorkerWindow.invokeWorkerWindowKeyboardEventAction(type, keyCode,modifiers)
  }

  sendCharKeyboardEvent(keyCode: string) {
    return this.sendKeyboardEvent('char', keyCode);
  }

  async sendClick({left,top}:{left:number,top:number},offset:number = 10,sleepMs:number = 100) {
    await this.sendMouseEvent("left","mouseDown",left + offset,top + offset)
    await sleep(sleepMs)
    await this.sendMouseEvent("left","mouseUp",left + offset,top + offset)
    await sleep(sleepMs)
  }
  sendMouseEvent(button:"left" | "right", type:"mouseDown"| "mouseUp", x:number, y:number) {
    return this.bridgeWorkerWindow.invokeWorkerWindowMouseEventAction({
      button,
      type,
      x,
      y
    })
  }

  sendEnterKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u000d');
  }
  sendSpaceKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u0020');
  }
  sendBackSpaceKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u0008');
  }
  sendTabKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u0009');
  }
  sendEscKeyboardEvent() {
    return this.sendCharKeyboardEvent('\u001b');
  }
}
