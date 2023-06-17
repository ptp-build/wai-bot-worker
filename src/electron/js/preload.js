const { contextBridge, ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(process.platform === "darwin" ? -3 : -4);
const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

const botId = args[0]
const chatGptUsername = args[1].replace("chatGptUsername=","")
const chatGptPassword = args[2].replace("chatGptPassword=","")

console.log("[Preload]",window.location.href)
console.log("[Preload] botId: ",botId,process.argv)
console.log("[Preload] chatGptUsername: ",chatGptUsername,"chatGptPassword:",chatGptPassword)

class ElectronIpcRender{
  addEvents(){
    console.log("[ElectronIpcRender addEvents!!!]")
    ipcRenderer.on('ipcRenderMsg', (event, action,payload) => {
      console.log('[ipcRenderMsg]', action,payload);
      window.dispatchEvent(new CustomEvent('ipcJsMsg', {detail:{action,payload}} ));
    });
  }
}

contextBridge.exposeInMainWorld('WaiApi', {
  onJsMsg: (action, payload) => {
    console.debug("onJsMsg",action,payload)
    ipcRenderer.send('ipcMainMsg',action,{__botId:botId,...(payload||{})});
  },
});

async function readAppendFile(name,code_pre = ''){
  try {
    const filePath = path.join(__dirname, name);
    const code = await fs.promises.readFile(filePath, 'utf8');
    const script = document.createElement('script');
    script.textContent = code_pre + code;
    document.body.appendChild(script);
  } catch (err) {
    console.error(`Error reading ${name}:`, err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DOMContentLoaded] event fired',window.version);
  await readAppendFile("zepto.js")
  await readAppendFile("worker.js", `
  const __botId = "${botId}";
  const __chatGptUsername = "${chatGptUsername}";
  const __chatGptPassword = "${chatGptPassword}";
  console.log("[args inject!]");
  `)
});


document.addEventListener('dblclick', (event) => {
  try {
    const {clientX,clientY,pageX,pageY,screenX,screenY} = event
    const {innerWidth,innerHeight} = window;
    ipcRenderer.send('ipcMainMsg',IpcMainCallbackButtonAction,{
      __botId:botId,
      data:"ipcMain/getSize",
      eventData:{innerWidth,innerHeight,clientX,clientY,pageX,pageY,screenX,screenY}
    })
  }catch (e){

  }
})

new ElectronIpcRender().addEvents()
