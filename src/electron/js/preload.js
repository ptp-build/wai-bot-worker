const { contextBridge, ipcRenderer } = require("electron");
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(-2);
const IpcMainCallbackButtonAction = "ipcMainCallbackButton";

const botId = args[0]
const optionsBufferHex = args[1]
const options = JSON.parse(Buffer.from(optionsBufferHex,"hex").toString())

console.log("[Preload]",window.location.href,botId,options)

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

async function readAppendFile(name){
  try {
    const filePath = path.join(__dirname, name);
    const code = await fs.promises.readFile(filePath, 'utf8');
    const script = document.createElement('script');
    script.textContent = code;
    document.body.appendChild(script);
  } catch (err) {
    console.error(`Error reading ${name}:`, err);
  }
}

async function appendCode(code){
  try {
    const script = document.createElement('script');
    script.textContent = code
    document.body.appendChild(script);
  } catch (err) {
    console.error(`Error:`, err);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  console.log('[DOMContentLoaded] event fired',window.version);
  await appendCode(`
  const __botId = ${botId};
  const __chatGptUsername = "${options.chatGptUsername}";
  const __chatGptPassword = "${options.chatGptPassword}";
  console.log("[args inject!]")
  `)
  await readAppendFile("zepto.js")
  await readAppendFile("worker.js")
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
