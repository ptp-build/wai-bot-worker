const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = [
  //
  // new ProvidePlugin({
  //   Buffer: ['buffer', 'Buffer'],
  // }),
  new ForkTsCheckerWebpackPlugin(),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'src/assets/lib'),
        to: path.resolve(__dirname, '.webpack/main/lib'),
      }
    ],
  }),
];
