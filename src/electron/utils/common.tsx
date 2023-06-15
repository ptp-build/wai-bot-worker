import { ChatGptWaiChatBot } from '../services/ai/ChatGptWaiChatBot';

export const initMobileFetch = () => {
  (function () {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const url = args[0];
      const options = args[1];
      console.log('on fetch', url);
      if (
        (options && options.signal && typeof url !== 'string') ||
        typeof url !== 'string' ||
        url?.indexOf('backend-api/conversation') > 0
      ) {
        ChatGptWaiChatBot.getCurrentObj()!.onRequestRemote(options);
      }
      // @ts-ignore
      const response = await originalFetch.apply(this, args);
      // @ts-ignore
      if (options && options.signal && url?.indexOf('backend-api/conversation') > 0) {
        if (response.ok) {
          if (response.body && options) {
            ChatGptWaiChatBot.getCurrentObj()?.onStart();
            const transformStream = new TransformStream({
              transform(chunk, controller) {
                // 将数据传递给原始调用方
                controller.enqueue(chunk);

                // 在这里处理数据
                const decoder = new TextDecoder();
                const v = decoder.decode(chunk);
                // ChatGptWaiChatBot.getCurrentObj()?.onData(v);
              },
            });

            // 将原始响应的 body 传递给 TransformStream
            response.body.pipeThrough(transformStream);

            return new Response(transformStream.readable, {
              headers: response.headers,
              status: response.status,
              statusText: response.statusText,
            });
          } else {
            ChatGptWaiChatBot.getCurrentObj()?.onError('Api Error: ' + response.status);
          }
        } else {
          ChatGptWaiChatBot.getCurrentObj()?.onError(await response.clone().text());
        }
      }
      return response;
    };
  })();
};
