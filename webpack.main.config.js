import path from 'path';

import {
  ProvidePlugin,
} from 'webpack';

module.exports = {
  entry: {
    main: './src/main.ts',
    worker_chatGpt: './src/plugins/js/worker_chatGpt.ts',
    worker_telegram: './src/plugins/js/worker_telegram.ts',
    worker_custom: './src/plugins/js/worker_custom.ts',
    bot_custom: './src/plugins/js/bot_custom.ts',
    bot_telegram: './src/plugins/js/bot_telegram.ts',
    bot_chatGpt: './src/plugins/js/bot_chatGpt.ts',
    testCase: './src/plugins/js/testCase.ts',
    preload: './src/preload.ts',
  },

  output: {
    filename: (pathData) => {
      const entryName = pathData.chunk.name;
      if(entryName === "main"){
        return `index.js`;
      }else if(entryName === "preload"){
        return `preload.js`;
      }else{
        return `plugins/js/${entryName}.js`;
      }
    },
    path: path.resolve(__dirname,".webpack","main"),
  },

  // Put your normal webpack config below here
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
    // fallback: {
    //   buffer: require.resolve('buffer/'),
    // },
  },
};
