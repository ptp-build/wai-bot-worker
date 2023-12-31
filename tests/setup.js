function simpleFormatter(type, message) {
  const TITLE_INDENT = ' ';
  const CONSOLE_INDENT = TITLE_INDENT + '  ';

  return (
    '> ' +
    message
      .split(/\n/)
      .map(line => CONSOLE_INDENT + line)
      .join('\n')
  );
}

jest.mock('ws', () => {
  const mWebSocket = {
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  };

  const mWebSocketServer = {
    on: jest.fn(),
    close: jest.fn(),
  };

  function WebSocket() {
    return mWebSocket;
  }

  WebSocket.Server = function () {
    return mWebSocketServer;
  };

  return WebSocket;
});

global.DBInstanceConfig = {
  host: "127.0.0.1",
  user: "root",
  password: "root",
  database: "wai-test",
  port:3306
}

global.RedisConfig = {
  url: 'redis://localhost:6379/12',
}


jest.setTimeout(100000)

