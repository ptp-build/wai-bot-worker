import BotWorker from "./taskWorker/BotWorker";
import {LocalWorkerAccountType} from "../../types";

const {$,__worker_account} = window

$(()=>{
  const workerAccount = __worker_account as LocalWorkerAccountType
  //console.log("[workerAccount]",workerAccount)
  document.title = ("# "+workerAccount.botId + " TaskWorker")
  window['wai_worker'] = new BotWorker(workerAccount).addEvents()
})
