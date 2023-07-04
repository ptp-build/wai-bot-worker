
declare global {
  interface Window {
    electron?: ElectronApi;
    $?: any;
    WORKER_ACCOUNT?:any;
    TestCase?:any;
  }
}

export enum ElectronEvent {
  FULLSCREEN_CHANGE = 'fullscreen-change',
  UPDATE_ERROR = 'update-error',
  UPDATE_DOWNLOADED = 'update-downloaded',
}

export enum ElectronAction {
  GET_IS_FULLSCREEN = 'get-is-fullscreen',
  INSTALL_UPDATE = 'install-update',
  HANDLE_DOUBLE_CLICK = 'handle-double-click',
  OPEN_NEW_WINDOW = 'open-new-window',
}

export interface ElectronApi {
  invokeRenderBridgeAction:(botId:string,action:RenderActions,payload:any)=>Promise<any|undefined>
  invokeWorkerWindowAction:(botId:string,action:WorkerEventActions,payload:any)=>Promise<void>
  invokeMasterWindowAction:(botId:string,action:MasterEventActions,payload:any)=>Promise<void>
  invokeWindowDbAction:(actionData:WindowDbActionData)=>Promise<any>
  invokeWorkerWindowKeyboardEventAction:(botId:string,type:string,keyCode:string)=>Promise<void>
  invokeWorkerWindowMouseEventAction:(botId:string,paylaod:any)=>Promise<void>
  isFullscreen: () => Promise<boolean>;
  installUpdate: () => Promise<void>;
  handleDoubleClick: () => Promise<void>;
  openNewWindow: (url: string) => Promise<void>;

  on: (eventName: ElectronEvent| WorkerEvents | MasterEvents, callback: any) => VoidFunction;
}


export abstract class BaseConnection {
  constructor(public id: string) {}
  abstract send(message: Buffer): void;
  abstract close(): void;
}

export type SendMessageRequest = {
  chatId:string,
  localMsgId:number,
  text:string,
  entities?:any[]
  taskId?:number
}

export type SendBotCommandRequest = {
  chatId:string,
  localMsgId:number,
  command:string
}


export type NewMessage = {
  chatId:string,
  msgId:number,
  text?:string,
  content?:object,
  isOutgoing?:boolean,
  senderId?:string,
  msgDate?:number,
  inlineButtons?:object[][],
  entities?:object[]
}

export type SendMessageAck = {
  localMsgId:number;
  chatId:string;
  msgId:string
}

export type SendMessageResponse = {
  ack:SendMessageAck
  newMessage?:NewMessage
}


export type MessageUpdate = {
  msgId:number;
  chatId:string;
  senderId:string;
  text:string
}



export type AuthSessionType = {
  authUserId: string;
  ts: number;
  address: string;
  clientId: number;
  chatId?: string;
};

export interface AccountUser {
  connection:BaseConnection,
  session?: AuthSessionType;
  token?: string;
  id: string
}


export type LocalWorkerType="chatGpt" | 'taskWorker'| 'custom' | 'coding'  | 'sql'

export type LocalWorkerAccountType = {
  botId:string,
  username:string,
  bio:string,
  type:LocalWorkerType,
  name:string,
  appWidth:number,
  appHeight:number,
  appPosX:number,
  appPosY:number
  proxy?:string,
  chatGptAuth?:string,
  browserUserAgent?:string,
  chatGptRole?:string,
  promptFormat?:string,
  replyParser?:string,
  taskWorkerUri?:string,
  customWorkerUrl?:string,
  pluginJs?:string,
  mysqlMsgStorageDsn?:string,
  projectRootDir?:string,
}

export type UserInfoType = {
  bio:string,
  userId:string,
  firstName:string,
  username?:string
}

export enum WorkerEvents {
  Worker_Chat_Msg = 'Worker_Chat_Msg',
}

export enum WorkerEventActions {
  Worker_TaskAiMsg = 'Worker_TaskAiMsg',
  Worker_AskMsg = 'Worker_AskMsg',
  Worker_LoadUrl = 'Worker_LoadUrl',
  Worker_Reload = 'Worker_Reload',
  Worker_ShowDevTools = 'Worker_ShowDevTools',
  Worker_GoBack = 'Worker_GoBack',
  Worker_ActiveWindow = 'Worker_ActiveWindow',

  Worker_GetWorkerStatus = 'Worker_GetWorkerStatus',
  Worker_UpdateWorkerAccount = 'Worker_UpdateWorkerAccount',
  Worker_NotifyWorkerStatus = 'Worker_NotifyWorkerStatus',
  Worker_CallBackButton = 'Worker_CallBackButton',
}

export enum MasterEvents {
  Master_Chat_Msg = 'Master_Chat_Msg',
}

export enum MasterEventActions {
  GetFileData = "GetFileData",
  SaveFileData = "SaveFileData",
  CreateWorker = "CreateWorker",
  CreateChatGptBot = 'CreateChatGptBot',
  CreateTaskWorkerBot = 'CreateTaskWorkerBot',
  NewMessage = 'NewMessage',
  NewContentMessage = 'NewContentMessage',
  NewMessageByTaskWorker = "NewMessageByTaskWorker",
  UpdateMessage = 'UpdateMessage',
  FinishChatGptReply = 'FinishChatGptReply',
  DeleteMessages = 'DeleteMessages',
  DebugLogMessage = 'DebugLogMessage',
  MessageListScrollDownEnd = 'MessageListScrollDownEnd',
  UpdateWorkerStatus = 'UpdateWorkerStatus',
  GetWorkersStatus = 'GetWorkersStatus',
  RestartWorkerWindow = 'RestartWorkerWindow',
  GetWorkersAccount = 'GetWorkersAccount',
  UpdateUserInfo = 'UpdateUserInfo',
}

export enum ServerEventActions {
  Local_CreateChatGptBot = 'Local_CreateChatGptBot',
}


export enum RenderActions {
  InitWaiApp="InitWaiApp",
  UpdateWorkerStatus="UpdateWorkerStatus",
  AnswerCallbackButton="answerCallbackButton",
  SendMessage="sendMessage",
  UpdateMessage="updateMessage",
  SendBotCommand="sendBotCommand",
  DeleteMessages="deleteMessages",
  EnableMultipleQuestion="enableMultipleQuestion",
  SendMultipleQuestion="SendMultipleQuestion",
  LoadBotCommands="loadBotCommands",
  GetWorkerAccount="getWorkerAccount",
  GetWorkerAccountChatGptAuth="getWorkerAccountChatGptAuth",
  GetWorkerAccountProxy="getWorkerAccountProxy",
  DeleteChat="DeleteChat",
  DeleteChatMessages="deleteChatMessages",
  GetWorkerStatus="getWorkerStatus",

  ApplyMsgId="applyMsgId",
  GetAiAskTask="GetAiAskTask",
  ReportAiAskTask="ReportAiAskTask",
  ServerLoop="ServerLoop",
  GetMsgInfo="GetMsgInfo",
}

export enum WindowActions {
  WorkerWindowAction="WorkerWindowAction",
  MasterWindowAction="MasterWindowAction",
  WorkerWindowKeyboardAction="WorkerWindowKeyboardAction",
  WorkerWindowMouseAction="WorkerWindowMouseAction",
  WindowDbAction="WindowDbAction",
  MasterWindowCallbackAction = "MasterWindowCallbackAction",
  WorkerWindowCallbackAction = "WorkerWindowCallbackAction",
}

export enum CallbackButtonAction {
  Master_createTaskWorker = 'Master_createTaskWorker',
  Master_createCustomWorker = 'Master_createCustomWorker',
  Master_createCodingWorker = 'Master_createCodingWorker',
  Master_createChatGptBotWorker = 'Master_createChatGptBotWorker',
  Master_OpenWorkerWindow = 'Master_OpenWorkerWindow',
  Master_openUserAppDataDir = 'Master_openUserAppDataDir',
  Master_openPluginDir = "Master_openPluginDir",
  Master_closeAllWindow = "Master_closeAllWindow",
  Master_closeWorkerWindow = "Master_closeWorkerWindow",
  Master_appInfo = "Master_appInfo",

  Local_setupProxy = 'Local_setupProxy',
  Local_setupChatGptAuth = 'Local_setupChatGptAuth',
  Local_setupWorkerName = 'Local_setupWorkerName',
  Local_setupBrowserUserAgent = 'Local_setupBrowserUserAgent',
  Local_setupTaskUri = 'Local_setupTaskUri',
  Local_setupHomeUrl = 'Local_setupHomeUrl',
  Local_setupPluginJs = 'Local_setupPluginJs',
  Local_setupProjectRootDir = 'Local_setupProjectRootDir',
  Local_mysqlMsgStorage = 'Local_mysqlMsgStorage',
  Local_clearHistory = 'Local_clearHistory',
  Local_cancelMessage = 'Local_cancelMessage',
  Local_setupPromptFormat = 'Local_setupPromptFormat',
  Local_setupReplyParser = 'Local_setupReplyParser',
  Local_resend = 'Local_resend',

  Local_cancelInlineButtons = 'Local_cancelInlineButtons',

  Render_refreshControlPanel = 'Render_refreshControlPanel',
  Render_cancelMessage = 'Render_cancelMessage',
  Render_cancelRoleConfig = 'Render_cancelRoleConfig',
  Render_saveWorkerAccount = 'Render_saveWorkerAccount',
  Render_resendAiMsg = 'Render_resendAiMsg',
  Render_workerStatus = 'Render_workerStatus',
  Render_setupChatGptRole = 'Render_setupChatGptRole',
  Render_sendRoleDirectly = 'Render_sendRoleDirectly',


}

export enum WorkerCallbackButtonAction {
  Worker_fetchSiteInfo = 'Worker_fetchSiteInfo',
  Worker_clickLoginButton = 'Worker_clickLoginButton',
  Worker_inputPrompts = 'Worker_inputPrompts',
  Worker_getActions = 'Worker_getActions',
  Worker_sendPromptTextareaMouseClick = "Worker_sendPromptTextareaMouseClick",
  Worker_sendInputSpaceEvent = 'Worker_sendInputSpaceEvent',
  Worker_performClickSendPromptButton = "Worker_performClickSendPromptButton",
  Worker_clickRegenerateResponseButton = "Worker_clickRegenerateResponseButton",
  Worker_locationReload = "Worker_locationReload",
  Worker_historyGoBack = "Worker_historyGoBack",

  Worker_openDevTools = "Worker_openDevTools",
  Worker_browserUserAgent = "Worker_browserUserAgent",

  Worker_Tg_Chats = 'Worker_Tg_Chats',
  Worker_Tg_Open_Chat = 'Worker_Tg_Open_Chat',
}

export enum ServerCallbackButtonAction {
  Server_CreateChatGptBot = 'Server_CreateChatGptBot',
}

export type CallbackButtonActionType = ServerCallbackButtonAction | WorkerCallbackButtonAction | CallbackButtonAction

export type CallbackButtonRequest = {
  messageId:number,
  chatId:string,
}

export type CallbackButtonCreateWorkerRequest = {
  messageId:number,
  chatId:string,
  account?:LocalWorkerAccountType
}


export type WindowDbActionData = {
  action:"saveHttpRequest",
  payload:any
}

export enum BotStatusType {
  OFFLINE = "OFFLINE",
  STARTED = 'STARTED',
  ONLINE = 'ONLINE',
  RegenerateResponseNeed = "RegenerateResponseNeed",
  LoginButtonClickNeed = "LoginButtonClickNeed",
  ChallengeFormShow = 'ChallengeFormShow',
  LoginInputUsernameNeed = 'LoginInputUsernameNeed',
  LoginInputPasswordNeed = 'LoginInputPasswordNeed',

  TaskWorkerNoApi = 'TaskWorkerNoApi',
  TaskWorkerApiError = 'TaskWorkerApiError',
}

export enum BotWorkerStatusType {
  WaitToReady = 'WaitToReady',
  Ready = "Ready",
  InvokeApiError = 'InvokeApiError',
  Busy = "Busy",
}

export const EVENT_MESSAGE_LIST_SCROLL_DOWN_END = "EVENT_MESSAGE_LIST_SCROLL_DOWN_END"
export const EVENT_MESSAGE_LIST_ENABLE_SCROLL_DOWN_END = "EVENT_MESSAGE_LIST_ENABLE_SCROLL_DOWN_END"

export type ServerBotAccountType = {
  botId:string,
  type:"chatGpt",
  name?:string,
}

export type ReportChatGptAiTaskType = {
  id:number,
  userId:number,
  chatId:number,
  msgId:number,
  text:string,
  isDone?:boolean
}


export type ChatGptAiTaskType = {
  accountAddress:string,
  chatId:string,
  msgId: number;
  text: string;
  taskId: number;
  isDone?:boolean;
  isError?:boolean;
  msgDate?:number
}

export type SaveFileDataType = {
  type: "string" | "hex" | "base64";
  filePath:string,
  content:string
}

export type GetFileDataType = {
  filePath:string,
  type: "string" | "hex" | "base64" | "buffer";
}
