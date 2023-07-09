export function parseCodeBlock(text:string,entities?:any[]) {
  const reg = /```(.*?)\n([\s\S]*?)```/g;
  if(text.indexOf("```") >= 0 && text.split("```").length % 2 === 0){
    text =  text+"```";
  }
  let result = text;
  let match;
  let codeBlock = [];
  let i = 0;
  let j = 0;
  while (match = reg.exec(text)) {
    codeBlock.push({
      type:"MessageEntityPre",
      language: match[1],
      offset: match.index - 6 * i - j,
      length: match[2].length
    });
    j += match[1].length+1
    result = result.replace(match[0],  match[2]);
    ++i;
  }
  if(!entities){
    entities = []
  }
  return {
    text:result.endsWith("```") ? result.substring(0,result.indexOf("```")): result,
    entities:[
      ...codeBlock,
      ...entities
    ]
  };
}

export function parseMentionName(text:string,userNames:Record<string, string> ={},ignoreEntities:any[] = []) {
  const regex = /@\w+/g;
  let match;
  let result = [];
  while ((match = regex.exec(text)) !== null) {
    if(userNames[match[0]]){
      const entity = {
        type: 'MessageEntityMentionName',
        userId: userNames[match[0]],
        offset: match.index,
        length: match[0].length
      };
      const shouldIgnore = ignoreEntities.some(ignoreEntity =>
        entity.offset >= ignoreEntity.offset && entity.offset <= ignoreEntity.offset + ignoreEntity.length
      );

      if (!shouldIgnore) {
        result.push(entity);
      }
    }
  }
  return result.concat(ignoreEntities)
}

export function parseCmd(text: string, commands: string[],ignoreEntities:any[] = []) {
  if (commands.length === 0) return [];
  const regex = new RegExp(`(?<=\\/)(${commands.join('|')})\\b`, 'g');
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    const entity = {
      type: 'MessageEntityBotCommand',
      offset: match.index - 1,
      length: match[0].length + 1
    };

    // Check if entity should be ignored
    const shouldIgnore = ignoreEntities.some(ignoreEntity =>
      entity.offset >= ignoreEntity.offset && entity.offset <= ignoreEntity.offset + ignoreEntity.length
    );

    if (!shouldIgnore) {
      matches.push(entity);
    }
  }
  return matches.concat(ignoreEntities);
}

interface Entity {
  type: string;
  offset: number;
  length: number;
}

export function parseTag(text:string, tagDelimiter:string, entityType:'MessageEntityBold') {
  const tagPattern = new RegExp(`${tagDelimiter}(.*?)${tagDelimiter}`, 'g');
  const matches = text.match(tagPattern) || [];

  let offset = 0;
  return matches.map((match, index) => {
    const entityText = match
    const startOffset = text.indexOf(match, offset)
    offset = startOffset + match.length;

    return {
      type: entityType,
      offset: startOffset + 1,
      length: entityText.length - 2
    };
  })
}

export function parseEntities(text:string,commands:string[],userNames:Record<string, string> ={}){
  const codeParseRes = parseCodeBlock(text)
  text = codeParseRes.text;
  let entities = codeParseRes.entities || []
  //parseTag(text,"`","MessageEntityBold"),
  entities = parseCmd(text,commands,entities)
  entities = parseMentionName(text,userNames,entities)
  return {
    text,
    entities
  }
}
