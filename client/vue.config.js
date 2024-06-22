const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: path.resolve(__dirname, 'favicon'), to: 'assets' },
          { from: path.resolve(__dirname, 'service-worker.js'), to: '.' }
        ]
      })
    ],
    output: {
      filename: 'assets/[name].[hash].js',
      chunkFilename: 'assets/[name].[hash].js',
      assetModuleFilename: 'assets/[name].[hash][ext][query]'
    }
  },
  outputDir: 'dist',
  assetsDir: 'assets',
  chainWebpack: config => {
    config.plugin('html').tap(args => {
      args[0].template = path.resolve(__dirname, 'index.html');
      return args;
    });

    config.plugin('copy').use(CopyWebpackPlugin, [[
      { from: path.resolve(__dirname, 'favicon'), to: 'assets' },
      { from: path.resolve(__dirname, 'service-worker.js'), to: '.' }
    ]]);
  }
};
