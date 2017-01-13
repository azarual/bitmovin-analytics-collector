const webpack = require('webpack');
const packageProperties = require('./package.json');

module.exports = {
  entry: './js/core/BitmovinAnalyticsExport.js',
  output: {
    path: './build/',
    filename: packageProperties.name + '.min.js',
    libraryTarget: 'umd'
  },
  module: {
    preLoaders: [{
      loader: 'string-replace',
      query: {
        search: '{{VERSION}}',
        flags: 'g',
        replace: packageProperties.version
      }
    }],
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      output: {
        comments: false
      }
    })
  ]
}
