const execSync = require('child_process').execSync;
const packageJson = require('./package.json');
const path = require('path');
const webpack = require('webpack');
const WriteJsonPlugin = require('write-json-webpack-plugin');

const getGitVersion = () => execSync('git describe --abbrev=0').toString().trim();

const FULL_GIT_VERSION = execSync('git describe').toString().trim();

const makeReleasePackageJson = () => {
  return {
    name: packageJson.name,
    version: getGitVersion(),
    description: 'Bitmovin Analytics allows you to collect data about HTML5 Video playback',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/bitmovin/bitmovin-analytics-collector.git'
    },
    main: 'bitmovinanalytics.min.js',
    readme: 'ERROR: No README data found!',
    author: 'Bitmovin Inc',
    homepage: 'https://bitmovin.com/video-analytics/',
    maintainers: [{
      name: 'bitadmin',
      email: 'admin@bitmovin.com'
    }]
  }
};

const BANNER =
        '\n' +
        'Copyright (C) ' + new Date().getFullYear() + ', Bitmovin, Inc., All Rights Reserved\n' +
        '\n' +
        'This source code and its use and distribution, is subject to the terms\n' +
        'and conditions of the applicable license agreement.\n' +
        '\n' +
        packageJson.name + ' version ' + FULL_GIT_VERSION + '\n';

const BASE_BUILD_FOLDER = 'build'
const BASE_LIB_NAME = 'bitmovinanalytics';

const API_EXPORT_MODULE = './js/BitmovinAnalyticsCollector';

const mode = process.env.NODE_ENV;

function isDevMode() { return mode === 'development'; }

function makeConfig() {
  const buildFolder = path.resolve(isDevMode() ? path.join(BASE_BUILD_FOLDER, 'debug') : path.join(BASE_BUILD_FOLDER, 'release'));

  execSync('rm -Rf ' + buildFolder);

  const config = {
    mode,
    devtool: isDevMode() ? 'inline-source-map' : 'source-map',
    optimization: {
      minimize: !isDevMode()
    },
    entry: API_EXPORT_MODULE,
    output: {
      path: buildFolder,
      publicPath: buildFolder,
      libraryTarget: 'umd',
      library: BASE_LIB_NAME,
      filename: BASE_LIB_NAME + '.js',
    },
    resolve: {
      extensions: [".ts", ".js"]
    },
    module: {
      rules: [
        // all files with a `.ts` extension will be handled by `ts-loader`
        { test: /\.ts?$/, loader: "ts-loader" },
        { test: /\.js?$/, loader: "ts-loader" }
      ]
    },
    externals: {
      'hls.js': 'Hls'
    },
    plugins: [
      new webpack.BannerPlugin(BANNER),
      new webpack.DefinePlugin({
        __VERSION__: JSON.stringify(getGitVersion())
      })
    ]
  };

  if (!isDevMode()) {
    config.plugins.push(
      new WriteJsonPlugin({
        object: makeReleasePackageJson(),
        // plugin bug: putting an absolute resolved path here does the wrong thing, needs to be relative to output path
        path: '.',
        filename: 'package.json'
      })
    );
  }

  return config;
}

module.exports = makeConfig();





