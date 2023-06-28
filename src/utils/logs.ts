import * as electronLog from 'electron-log';
import * as path from 'path';
import WindowEventsHandler from "../window/events/WindowEventsHandler";
import {MasterEventActions} from "../types";

export type LogLevelType = 'info' | 'error' | 'warn' | 'debug';

export const ignoreConsoleMessage = (message: string) => {
  return message.includes("font-weight: bold; This renderer process has either ") ||
    message.includes("console.groupEnd") ||
    message.includes("xxx callApi('") ||
    message.includes("message.includes(\"%c%d\") ||") ||
    message.includes("%c%d") ||
    message.includes("%cGramJS%cUPDATE color: #E4D00A;") ||
    message.includes("const words =") ||
    message.includes("https://electronjs.org/docs/tutorial/security.") ||
    message.includes("%cElectron Security Warning") ||
    message.includes("[object HTMLAnchorElement]") ||
    message.includes("%c%d font-size:0;color:transparent NaN");
};

const logLevels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

function logWithFileAndLine(level: LogLevelType, ...args: any[]) {
  // if (logLevels[level] < logLevels[level]) {
  //   return;
  // }

  if (args.length > 0 && typeof args[0] === 'string' && ignoreConsoleMessage(args[0])) {
    return;
  }

  const error = new Error();

  // Check if error.stack is defined before using it
  if (error.stack && error.stack.split('\n').length > 2) {
    // We use stack traces to find the file and line number
    const stackLine = error.stack.split('\n')[2].trim();
    const match = stackLine.match(/at\s+(.*)\s+\((.*):(\d+):(\d+)\)/);
    let functionName = '';
    if (match) {
      functionName = match[1];
    }
    WindowEventsHandler.sendEventToMasterChat(
      MasterEventActions.DebugLogMessage,
      {
        name:`MAIN`,
        func:functionName.replace(".<anonymous>",""),
        level:level.toUpperCase(),
        args
      }
    ).catch((e)=>{});
    (electronLog[level] as any)(`[${level.toUpperCase()}] [${functionName.replace(".<anonymous>","")}]`, ...args);
  }
}

export function setUpLogs(minLevel: LogLevelType,dir?:string,fileName?:string) {
  console.log("1")
  electronLog.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] {text}';
  electronLog.transports.console.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] {text}';

  console.log = logWithFileAndLine.bind(null,minLevel);
  console.error = logWithFileAndLine.bind(null, minLevel);
  console.warn = logWithFileAndLine.bind(null, minLevel);
  console.debug = logWithFileAndLine.bind(null, minLevel);
  electronLog.transports.file.resolvePath = () => {
    return path.join(dir || __dirname, fileName || 'app.log');
  };
}
