import MsgConnChatGptBotWorkerManager, { MsgConnChatGptBotWorkerStatus } from './MsgConnChatGptBotWorkerManager';

describe('MsgConnChatGptBotWorkerManager', () => {
  it('should get a random READY chatgpt bot worker', () => {
    const manager = MsgConnChatGptBotWorkerManager.getInstance();

    manager.setStatus("0", MsgConnChatGptBotWorkerStatus.OFFLINE);
    manager.setStatus("1", MsgConnChatGptBotWorkerStatus.BUSY);
    manager.setStatus("2", MsgConnChatGptBotWorkerStatus.READY);
    manager.setStatus("3", MsgConnChatGptBotWorkerStatus.READY);
    manager.setStatus("4", MsgConnChatGptBotWorkerStatus.READY);

    const randomReadyWorker = manager.getRandomReadyWorker();

    if (randomReadyWorker) {
      console.log("randomReadyWorker",randomReadyWorker)
      expect(manager.getStatus(randomReadyWorker)).toBe(MsgConnChatGptBotWorkerStatus.READY);
    } else {
      fail('No READY worker was found');
    }
  });
});
