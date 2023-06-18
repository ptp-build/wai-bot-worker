const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

function getPositionRelativeToBody(element) {
  var position = { x: 0, y: 0 };

  while (element) {
    position.x += element.offsetLeft;
    position.y += element.offsetTop;
    element = element.offsetParent;
  }
  return position;
}

function getLoginButton(){
  var buttons = document.getElementsByTagName('button');
  let loginButton;
  for (var i = 0; i < buttons.length; i++) {
    if (buttons[i].textContent.includes("Log in")) {
      loginButton = buttons[i];
      break;
    }
  }
  return loginButton
}

const invoke_api = (action,payload)=>{
  console.log("[invoke_api]",action)
  window.WaiApi.onJsMsg(action,payload)
}

window.invoke_api = invoke_api

if (window.location.href.indexOf('chat.openai.com') > -1) {
  console.log("[fetch inited!!]",window.location.href);
  (function () {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = args[0];
      const options = args[1];
      //console.log('[on fetch]', url);
      let index = -1;
      if (options && options.signal && url.indexOf('backend-api/conversation') > 0) {
        console.log("[REQUEST]",JSON.parse(options.body).messages[0].content.parts[0])
        // invoke("MsgAction_WaiChatGptOnRecvMsg",{state:"REQUEST",text:JSON.stringify(options),index})
      }
      index += 1
      const response = await originalFetch.apply(this, args);
      if (options && options.signal && url.indexOf('backend-api/conversation') > 0) {
        if (response.ok) {
          const id = +(new Date())
          if (response.body && options) {
            invoke_api("MsgAction_WaiChatGptOnRecvMsg",{id,state:"START",index,text:""})
            const transformStream = new TransformStream({
              transform(chunk, controller) {
                controller.enqueue(chunk);
                index += 1
                const decoder = new TextDecoder();
                const text = decoder.decode(chunk);
                invoke_api("MsgAction_WaiChatGptOnRecvMsg",{id,state:"IN_PROCESS",index,text})
              },
            });
            response.body.pipeThrough(transformStream);
            return new Response(transformStream.readable, {
              headers: response.headers,
              status: response.status,
              statusText: response.statusText,
            });
          } else {
            const error = 'ERR_CODE: ' + response.status;
            invoke_api("MsgAction_WaiChatGptOnRecvMsg",{id,state:"ERROR",index,text:error})
          }
        } else {
          const error = await response.clone().text();
          invoke_api("MsgAction_WaiChatGptOnRecvMsg",{id,state:"ERROR",index,text:error})
        }
      }
      return response;
    };
  })();
}

let __currentWaiChatGptBotWorker

class WaiChatGptBotWorker{
  id = null;
  clicked = false;
  __rev_msg_map = {}
  promptsInputReady = false;
  constructor(id) {
    this.id = id
  }

  static getCurrentInstance(){
    if(!__currentWaiChatGptBotWorker){
      __currentWaiChatGptBotWorker = new WaiChatGptBotWorker(+(new Date()))
    }
    return __currentWaiChatGptBotWorker;
  }
  init(){
    console.log("===>>>> [WaiChatGptBotWorker init]",this.id)
    invoke_api("MsgAction_WaiChatGptBotWorkerInit")
    window.addEventListener('ipcJsMsg', ({detail}) => {
      const { action,payload } = detail;
      console.log("[ipcJsMsg]",action,payload)
      this.process(action,payload)
    })
    setInterval(()=>this.loop(),1000)
  }

  askMsg(text){
    document.querySelector("#prompt-textarea").value = text
  }
  loop(){
    // console.log("[Loop!!]",this.id,this.promptsInputReady)
    if(document.querySelector("#prompt-textarea")){
      if(!this.promptsInputReady){
        this.promptsInputReady = true;
        invoke_api("MsgAction_WaiChatGptPromptsInputReady")
      }else{
        invoke_api("MsgAction_WaiChatGptHeartBeat")
      }
    }

    if($(".absolute.inset-0").length > 0 && $(".absolute.inset-0").find("button")){
      $(".absolute.inset-0").find("button").click()
    }

    if($("#challenge-form").length > 0){
      invoke_api("MsgAction_WaiChatGptCfChallenge",getPositionRelativeToBody($("#challenge-form")[0]))
    }

    if($(".login-id").length > 0){
      const loginButton = getLoginButton()
      if(loginButton && !this.clicked){
        this.clickDelay(60000);
        invoke_api("MsgAction_WaiChatGptClickLogin",getPositionRelativeToBody($(loginButton)[0]))
      }
      if(__chatGptUsername && $("#username").length > 0 && !this.clicked){
        this.clickDelay();
        $("#username").val(__chatGptUsername)
        invoke_api("MsgAction_WaiChatGptInputUsername",getPositionRelativeToBody($("#username")[0]))
      }
    }
    if($("._form-login-password").length > 0){

      if(__chatGptPassword && $("#password").length > 0 && !this.clicked){
        this.clickDelay();
        $("#password").val(__chatGptPassword)
        invoke_api("MsgAction_WaiChatGptInputPassword",getPositionRelativeToBody($("#password")[0]))
      }
    }

  }
  clickDelay(timeout){
    this.clicked = true;
    setTimeout(()=>{
      this.clicked = false;
    },timeout||5000)
  }
  process(action,payload){
    switch(action){
      case IpcMainCallbackButtonAction:
        const  {__id} = payload
        delete payload.__id
        this.__rev_msg_map[__id] = payload
        break;
      case "askMsg":
        this.askMsg(payload.text);
        break;
      case "dong":
        console.log("[DONG]")
        break;
    }
  }
  waitForMsgCallback(
    seq_num,
    timeout = 5000,
    startTime = 0
  ) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this.__rev_msg_map[seq_num]) {
          const res = this.__rev_msg_map[seq_num];
          delete this.__rev_msg_map[seq_num];
          resolve(res);
        } else {
          if (startTime >= timeout) {
            reject('TIMEOUT');
          } else {
            this.waitForMsgCallback(seq_num, timeout, startTime)
              .then(resolve)
              .catch(reject);
          }
        }
      }, 100);
    });
  }

  callIpcMain(action,data){
    return new Promise((resolve, reject) => {
      const __id = +(new Date)
      invoke_api(action,{data,__id})
      this.waitForMsgCallback(__id)
        .then(resolve)
        .catch(reject);
    })
  }

  async handleCallbackButton(data){
    console.log("handleCallbackButton",data)
    if(data.indexOf("ipcMain") > -1){
      return await this.callIpcMain(IpcMainCallbackButtonAction,data)
    }
    if(data.indexOf("getButtons") > -1){
      return await this.callIpcMain(IpcMainCallbackButtonAction,data)
    }
    return {
      text:"error"
    }
  }
}
WaiChatGptBotWorker.getCurrentInstance().init();

window.__WaiBotWorker = WaiChatGptBotWorker.getCurrentInstance()

$(()=>{
  console.log("[worker] ready botId",__botId)
})
