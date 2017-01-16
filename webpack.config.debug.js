let {banner, entry, preLoaders, loaders} = require('./webpack.config.js');
const webpack = require('webpack');
const packageProperties = require('./package.json');

module.exports = {
  entry,
  output: {
    path: './build/debug',
    filename: packageProperties.name + '.min.js',
    libraryTarget: 'umd'
  },
  module: {
    preLoaders,
    loaders
  },
  plugins: [
    new webpack.BannerPlugin(banner)
  ]
}
