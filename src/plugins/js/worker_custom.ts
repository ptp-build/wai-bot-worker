import { LocalWorkerAccountType } from '../../sdk/types';
import BotWorkerCustom from './customeWorker';

new BotWorkerCustom(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()
