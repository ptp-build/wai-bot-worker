import BotWorkerSelector from "./chatGpt/BotWorkerSelector";
import BotWorker from "./chatGpt/BotWorker";
import {LocalWorkerAccountType} from "../../types";

const {$,__worker_account} = window

function hook_fetch(botWorker:BotWorker): void {
  const originalFetch = window.fetch;
  window.fetch = async function (...args: any[]): Promise<Response> {
    const url = args[0];
    let uri: URL;
    try {
      uri = new URL(url);
    } catch (e) {
      // @ts-ignore
      return await originalFetch.apply(this, args);
    }

    const options = args[1];
    let index = -1;
    if (options && options.signal && url.indexOf('backend-api/conversation') > 0) {
      console.log("[REQUEST]", JSON.parse(options.body).messages[0].content.parts[0]);
    }
    const msgId = Math.floor(+(new Date()) / 1000);
    index += 1;
    // @ts-ignore
    const response = await originalFetch.apply(this, args);
    if (options && options.signal && url.indexOf('backend-api/conversation') > 0) {
      if (response.ok) {
        if (response.body && options) {
          if(botWorker){
            botWorker.onSteamMsgRecv({ state: "START", index, text: "" });
          }
          const transformStream = new TransformStream({
            transform(chunk, controller) {
              controller.enqueue(chunk);
              index += 1;
              const decoder = new TextDecoder();
              const text = decoder.decode(chunk);
              if(botWorker){
                botWorker.onSteamMsgRecv({ state: "IN_PROCESS", index, text });
              }
              // invokeWindowDbAction({
              //     action: "saveHttpRequest",
              //     data: {
              //       rows: [
              //         {
              //           url,
              //           msgId,
              //           idx: index,
              //           host: uri.host,
              //           path: uri.pathname,
              //           data: chunk
              //         }
              //       ]
              //     }
              //   }
              // )
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
          if(botWorker){
            botWorker.onSteamMsgRecv({ state: "ERROR", index,text: error });
          }
        }
      } else {
        const error = await response.clone().text();
        if(botWorker){
          botWorker.onSteamMsgRecv({ state: "ERROR", index,text: error });
        }
      }
    }

    return response;
  };
}

$(()=>{
  const workerAccount = __worker_account as LocalWorkerAccountType
  //console.log("[workerAccount]",workerAccount)
  document.title = ("# "+workerAccount.botId + " ChatGpt")
  const wai_worker = new BotWorker(workerAccount).addEvents()
  hook_fetch(wai_worker);
  window['wai_selector'] = new BotWorkerSelector()
  window['wai_worker'] = wai_worker
})
