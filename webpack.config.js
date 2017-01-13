const webpack = require('webpack');
module.exports = {
  entry: './js/core/Bitanalytics.js',
  output: {
    path: './build/',
    filename: 'webpack.bundle.js'
  },
  module: {
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
