export const MasterBotId = "1000";

export const TEXT_AI_THINKING = "..."
export const NameFirstBot = "Bot Father";


export const CurrentUserInfo = {
  "id": "1",
  "accessHash": "",
  "firstName": "MasterChat",
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
      "username": "MasterChat",
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
    "bio": 'I am a assistant',
    "botInfo": {
      "botId": MasterBotId,
      "description": 'I am a assistant',
      "menuButton": {
        "type": "commands"
      },
      "commands": []
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
  "adminRights": {
    "changeInfo": true,
  },
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
  [1]:{
    "id": 1,
    "title": "Groups",
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
    "title": "Workers",
    "includedChatIds": [
      "20006","20007","20008","20009","20011"
    ],
    "channels": false,
    "pinnedChatIds": [],
    "excludedChatIds": []
  },
  5:{
    "id": 5,
    "title": "Notify",
    "includedChatIds": [

    ],
    "channels": false,
    "pinnedChatIds": [],
    "excludedChatIds": []
  }
}
export const FolderIds = [
  0,
  ...Object.keys(ChatFolders).map(Number)
]
export const DefaultAdminMembersById = {
  "userId": "",
  "isAdmin": true,
  "adminRights": {
    "other": true,
    "changeInfo": true,
    "banUsers": true,
    "addAdmins": true,
    "anonymous": false,
    "manageCall": true,
    "inviteUsers": true,
    "pinMessages": true,
    "editMessages": true,
    "manageTopics": true,
    "postMessages": true,
    "deleteMessages": true
  }
}
export const DefaultGroupInfo = {
  "chatInfo": {
    "id": "",
    "type": "chatTypeSuperGroup",
    "isMin": false,
    "title": "",
    "photos": [],
    "isForum": false,
    "isMuted": false,
    "isListed": true,
    "joinDate": 1688572362,
    "settings": {
      "canAddContact": false,
      "canReportSpam": false,
      "isAutoArchived": false,
      "canBlockContact": false
    },
    "isCreator": true,
    "accessHash": "",
    "avatarHash": "",
    "isVerified": false,
    "adminRights": {
      "changeInfo": true,
      // "other": true,
      // "banUsers": true,
      // "addAdmins": true,
      // "anonymous": false,
      // "manageCall": true,
      // "inviteUsers": true,
      // "pinMessages": true,
      // "editMessages": true,
      // "manageTopics": true,
      // "postMessages": true,
      // "deleteMessages": true
    },
    "isNotJoined": false,
    "isProtected": false,
    "unreadCount": 0,
    "isCallActive": false,
    "isJoinToSend": false,
    "membersCount": 0,
    "isJoinRequest": false,
    "sendAsPeerIds": [],
    "hasPrivateLink": false,
    "hasVideoAvatar": false,
    "isCallNotEmpty": false,
    "isSignaturesShown": false,
    "defaultBannedRights": defaultBannedRights,
    "unreadMentionsCount": 0,
    "lastReadInboxMessageId": 0,
    "lastReadOutboxMessageId": 0
  },
  "chatInfoFull": {
    adminMembersById:{
      "1":DefaultAdminMembersById
    },
    "about": "",
    "members": [
      {
        isAdmin:true,
        userId:"",
        joinedDate:0
      }
    ],
    "inviteLink": "",
    "botCommands": [],
    "kickedMembers": [],
    "canViewMembers": true,
    "statisticsDcId": 5,
    "enabledReactions": {
      "type": "all",
      "areCustomAllowed": true
    },
    "canViewStatistics": false,
    "isPreHistoryHidden": true,
    "areParticipantsHidden": false
  }
}
