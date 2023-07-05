export const MasterBotId = "1000";

export const TEXT_AI_THINKING = "..."
export const NameFirstBot = "Wai";
export const DEFAULT_WAI_USER_BIO = 'I am a assistant'
export const BOT_FOLDER_TITLE = 'Wai'
export const BOT_FOLDER_ID = 1


export const DEFAULT_BOT_NO_AI_COMMANDS = [
  {
    "command": "start",
    "description": "Start a chat"
  },
]

export const DEFAULT_BOT_AI_COMMANDS = []


export const CurrentUserInfo = {
  "id": "1",
  "accessHash": "",
  "firstName": "Me",
  "lastName": "",
  "canBeInvitedToGroup": false,
  "hasVideoAvatar": false,
  "isMin": false,
  "isPremium": false,
  "noStatus": true,
  "fullInfo": {
    "isBlocked": false,
    "noVoiceMessages": false,
    "bio": "",
  },
  "usernames": [
    {
      "username": "me",
      "isActive": true,
      "isEditable": true
    }
  ],
  "type": "userTypeBot",
  "phoneNumber": "",
  "avatarHash": "",
  "isSelf": true
}

export const WaiUserInfo = {
  "id": MasterBotId,
  "fullInfo": {
    "isBlocked": false,
    "noVoiceMessages": false,
    "bio": DEFAULT_WAI_USER_BIO,
    "botInfo": {
      "botId": MasterBotId,
      "description": DEFAULT_WAI_USER_BIO,
      "menuButton": {
        "type": "commands"
      },
      "commands": DEFAULT_BOT_AI_COMMANDS.map((cmd:any)=>{
        return {...cmd,botId:MasterBotId}
      })
    }
  },
  "accessHash": "",
  "firstName": NameFirstBot,
  "lastName": "",
  "canBeInvitedToGroup": false,
  "hasVideoAvatar": false,
  "isMin": false,
  "isPremium": true,
  "noStatus": true,
  "usernames": [
    {
      "username": "wai",
      "isActive": true,
      "isEditable": true
    }
  ],
  "type": "userTypeBot",
  "phoneNumber": "",
  "avatarHash": "",
  "isSelf": false
}
export const defaultBannedRights = {
  sendMedia:true,
  sendStickers:true,
  sendGifs:true,
  sendPhotos:true,
  sendVideos:true,
  sendRoundvideos:true,
  sendAudios:true,
  sendVoices:true,
  sendDocs:true,
  sendPolls:true,
  // viewMessages?: true;
  // sendMessages?: true;
  // sendMedia?: true;
  // sendStickers?: true;
  // sendGifs?: true;
  // sendGames?: true;
  // sendInline?: true;
  // embedLinks?: true;
  // sendPolls?: true;
  // changeInfo?: true;
  // inviteUsers?: true;
  // pinMessages?: true;
  // manageTopics?: true;
  // sendPhotos?: true;
  // sendVideos?: true;
  // sendRoundvideos?: true;
  // sendAudios?: true;
  // sendVoices?: true;
  // sendDocs?: true;
  // sendPlain?: true;
  // untilDate?: number;
}
export const WaiChatInfo = {
  "id": MasterBotId,
  "title":  NameFirstBot,
  "type": "chatTypePrivate",
  "isMuted": false,
  "isMin": false,
  "hasPrivateLink": false,
  "isSignaturesShown": false,
  "isVerified": true,
  "isJoinToSend": true,
  "isJoinRequest": true,
  "isForum": false,
  "isListed": true,
  "settings": {
    "isAutoArchived": false,
    "canReportSpam": false,
    "canAddContact": false,
    "canBlockContact": false
  },
  "accessHash": "",
  "currentUserBannedRights":defaultBannedRights,
  "defaultBannedRights":defaultBannedRights
}

export const ChatFolders = {
  [BOT_FOLDER_ID]:{
    "id": BOT_FOLDER_ID,
    "title": BOT_FOLDER_TITLE,
    "includedChatIds": [
      MasterBotId
    ],
    "channels": false,
    "pinnedChatIds": [],
    "excludedChatIds": []
  },
  2:{
    "id": 2,
    "title": "Dev",
    "includedChatIds": [
      "20010","20014"
    ],
    "channels": false,
    "pinnedChatIds": [],
    "excludedChatIds": []
  },
  3:{
    "id": 3,
    "title": "Gpt",
    "includedChatIds": [
      "20001","20002","20004",
    ],
    "channels": false,
    "pinnedChatIds": [],
    "excludedChatIds": []
  },
  4:{
    "id": 4,
    "title": "Platform",
    "includedChatIds": [
      "20006","20007","20008","20009","20011"
    ],
    "channels": false,
    "pinnedChatIds": [],
    "excludedChatIds": []
  }
}
export const FolderIds = [
  0,
  BOT_FOLDER_ID,
  2,
  3,
  4
]

