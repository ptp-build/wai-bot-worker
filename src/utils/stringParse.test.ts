import {parseCmd, parseCodeBlock, parseEntities, parseMentionName, parseTag} from "./stringParse";

describe('parseTag', () => {
  it('should correctly parse tag', () => {
    const text = "`Bold` `Bold` `Bold``Bold1`";
    const entities = parseTag(text, "`", "MessageEntityBold");

    const expected = [
      {
        type: 'MessageEntityBold',
        offset: 1,
        length: 4
      },
      {
        type: 'MessageEntityBold',
        offset: 8,
        length: 4
      },
      {
        type: 'MessageEntityBold',
        offset: 15,
        length: 4
      },
      {
        type: 'MessageEntityBold',
        offset: 21,
        length: 5
      }
    ]
    for (let i = 0; i < entities.length; i++) {
      expect(entities[i].offset).toEqual(expected[i].offset)
      expect(entities[i].length).toEqual(expected[i].length)
    }
  });
  it('should correctly parse tag1', () => {
    const text = "`Boldss` `Bold``Bold`";
    const entities = parseTag(text, "`", "MessageEntityBold");
    const expected = [
      {
        type: 'MessageEntityBold',
        offset: 1,
        length: 6
      },
      {
        type: 'MessageEntityBold',
        offset: 10,
        length: 4
      },
      {
        type: 'MessageEntityBold',
        offset: 16,
        length: 4
      }
    ]

    for (let i = 0; i < entities.length; i++) {
      expect(entities[i].offset).toEqual(expected[i].offset)
      expect(entities[i].length).toEqual(expected[i].length)
    }

  });
  it('should correctly parse commands1', () => {
    const text = "/setting/start /setting";
    const commands = ["setting", "start"];
    const result = parseCmd(text, commands);
    const expected = [
      {
        type: 'MessageEntityBotCommand',
        offset: 0,
        length: 8
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 8,
        length: 6
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 15,
        length: 8
      }
    ];
    expect(result)
      .toEqual(expected);
  });
});

describe('parseCmd', () => {
  it('should correctly parse commands', () => {
    const text = "/setting/setting /setting";
    const commands = ["setting"];
    const result = parseCmd(text, commands);
    const expected = [
      {
        type: 'MessageEntityBotCommand',
        offset: 0,
        length: 8
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 8,
        length: 8
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 17,
        length: 8
      }
    ];
    expect(result)
      .toEqual(expected);
  });
  it('should correctly parse commands1', () => {
    const text = "/setting/start /setting";
    const commands = ["setting", "start"];
    const result = parseCmd(text, commands);
    const expected = [
      {
        type: 'MessageEntityBotCommand',
        offset: 0,
        length: 8
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 8,
        length: 6
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 15,
        length: 8
      }
    ];
    expect(result)
      .toEqual(expected);
  });
});

describe('parseMentionName', () => {
  it('should correctly parse mention names', () => {
    const text = "@username1 @username2@username3";
    const userNames = {
      "@username1": "userId1",
      "@username2": "userId2",
      "@username3": "userId3"
    };
    const result = parseMentionName(text, userNames);
    const expected = [
      {
        type: 'MessageEntityMentionName',
        userId: 'userId1',
        offset: 0,
        length: 10
      },
      {
        type: 'MessageEntityMentionName',
        userId: 'userId2',
        offset: 11,
        length: 10
      },
      {
        type: 'MessageEntityMentionName',
        userId: 'userId3',
        offset: 21,
        length: 10
      }
    ];
    expect(result)
      .toEqual(expected);
  });
});

describe('parseMentionName and parseCmd', () => {
  it('should correctly parse mention names and commands', () => {
    const text = "@username /setting /start";
    const userNames = {
      "@username": "userId1"
    };
    const commands = ["setting", "start"];

    const mentionResult = parseMentionName(text, userNames);
    const mentionExpected = [
      {
        type: 'MessageEntityMentionName',
        userId: 'userId1',
        offset: 0,
        length: 9
      }
    ];
    expect(mentionResult)
      .toEqual(mentionExpected);

    const cmdResult = parseCmd(text, commands);
    const cmdExpected = [
      {
        type: 'MessageEntityBotCommand',
        offset: 10,
        length: 8
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 19,
        length: 6
      }
    ];
    expect(cmdResult)
      .toEqual(cmdExpected);
  });
});

describe('parseCodeBlock', () => {
  it('should correctly parse code blocks', () => {
    const text = `this is a js demo:\`\`\`\nconsole.log("hello world")\n\`\`\`\n\nthis is a python demo:\`\`\`python\nprint("hello world")\n\`\`\`\n\nthis is a c++ demo:\`\`\`\nprint("hello world")\n\`\`\`\n`;
    const result = parseCodeBlock(text);
    // console.log(result)
    const expected = {
      text: `this is a js demo:console.log("hello world")\n\n\nthis is a python demo:print("hello world")\n\n\nthis is a c++ demo:print("hello world")\n\n`,
      entities: [
        {
          type: 'MessageEntityPre',
          language: '',
          offset: 18,
          length: 27
        },
        {
          type: 'MessageEntityPre',
          language: 'python',
          offset: 69,
          length: 21
        },
        {
          type: 'MessageEntityPre',
          language: '',
          offset: 111,
          length: 21
        }
      ]
    };
    expect(result)
      .toEqual(expected);
  });
});



describe('parseEntities', () => {
  const text = 'Sample text with```python\nprint("hello")\n````code`,/code @mention, and #tag';
  const commands = ['code'];
  const userNames = { 'user123': 'John' };

  test('should parse entities correctly', () => {
    const expectedEntities = [
      {
        type: 'MessageEntityPre',
        language: 'python',
        offset: 16,
        length: 15,
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 38,
        length: 5,
      },
      {
        type: 'MessageEntityBotCommand',
        offset: 32,
        length: 4,
      },
    ];

    const result = parseEntities(text, commands, userNames);
    console.log(result)
    // expect(result.text).toEqual("Sample text withprint(\"hello\")\n`code`,\/code @mention, and #tag");
    // expect(result.entities).toEqual(expectedEntities);
  });
});

