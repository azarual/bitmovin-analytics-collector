const execSync = require('child_process').execSync
const packageProperties = require('./package.json');

const getGitVersion = () => {
  return execSync('git describe')
}
const banner =
        '\n' +
        'Copyright (C) ' + new Date().getFullYear() + ', Bitmovin, Inc., All Rights Reserved\n' +
        '\n' +
        'This source code and its use and distribution, is subject to the terms\n' +
        'and conditions of the applicable license agreement.\n' +
        '\n' +
        packageProperties.name + ' version ' + getGitVersion() + '\n';

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
