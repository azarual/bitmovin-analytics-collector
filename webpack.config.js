const packageProperties = require('./package.json');

const banner =
        '\n' +
        'Copyright (C) ' + new Date().getFullYear() + ', Bitmovin, Inc., All Rights Reserved\n' +
        '\n' +
        'This source code and its use and distribution, is subject to the terms\n' +
        'and conditions of the applicable license agreement.\n' +
        '\n' +
        packageProperties.name + ' version ' + packageProperties.version + '\n';

const entry = './js/core/BitmovinAnalyticsExport.js';

let preLoaders = [{
  loader: 'string-replace',
  query : {
    search : '{{VERSION}}',
    flags  : 'g',
    replace: packageProperties.version
  }
}];

let loaders = [{
  test   : /\.js$/,
  exclude: /node_modules/,
  loader : 'babel-loader'
}, {
  loader: 'string-replace',
  query : {
    search : '{{VERSION}}',
    flags  : 'g',
    replace: packageProperties.version
  }
}];

module.exports = {
  banner,
  entry,
  preLoaders,
  loaders
}
