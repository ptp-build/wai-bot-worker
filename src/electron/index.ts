import { app } from 'electron';
import { isProd, parseAppArgs } from './args';
import { setUpLogs } from './utils/logs';
import MainWindowManager, { MasterWindowBotId } from './MainWindowManager';

const userDataPath = app.getPath('userData');

const appArgs = parseAppArgs();

const logLevel = isProd ? "debug" : "debug"
console.debug("[AppArgs]",appArgs)
console.log("[userDataPath]",userDataPath)

setUpLogs("default",logLevel,userDataPath)

app.on('ready', async () => {
  await MainWindowManager.getInstance(MasterWindowBotId).init(appArgs)
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  console.log("before-quit")
});
