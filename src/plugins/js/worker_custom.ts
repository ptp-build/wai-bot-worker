import { LocalWorkerAccountType } from '../../types';
import BotWorkerCustom from './customeWorker';


new BotWorkerCustom(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()
