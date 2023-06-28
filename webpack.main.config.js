import path from 'path';

module.exports = {
  /**
   * This is the main entry point for your application, it's the first file
   * that runs in the main process.
   */
  // entry: './src/main.ts',

  entry: {
    main: './src/main.ts',
    worker_chatGpt: './src/plugins/js/worker_chatGpt.ts',
    worker_taskWorker: './src/plugins/js/worker_taskWorker.ts',
    worker_custom: './src/plugins/js/worker_custom.ts',
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
  },
};
