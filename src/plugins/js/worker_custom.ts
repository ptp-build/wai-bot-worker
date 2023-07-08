import { LocalWorkerAccountType } from '../../sdk/types';
import BotWorkerCustom from './customWorker';

new BotWorkerCustom(window.WORKER_ACCOUNT as LocalWorkerAccountType).addEvents()
