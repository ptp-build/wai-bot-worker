const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'src/electron/assets'),
        to: path.resolve(__dirname, '.webpack/main/electron/assets'),
      },
      {
        from: path.resolve(__dirname, 'src/electron/js'),
        to: path.resolve(__dirname, '.webpack/main/electron/js'),
      },
    ],
  }),
];
