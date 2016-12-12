module.exports = function(grunt) {
  var patterns = [{
    match: /\{\{VERSION\}\}/g,
    replacement: '<%= pkg.version %>'
  }];
  var header =
        '/****************************************************************************\n' +
        ' * Copyright (C) 2016, Bitmovin, Inc., All Rights Reserved\n' +
        ' *\n' +
        ' * This source code and its use and distribution, is subject to the terms\n' +
        ' * and conditions of the applicable license agreement.\n' +
        ' *\n' +
        ' * <%= pkg.name %> version <%= pkg.version %>\n' +
        ' *\n' +
        ' ****************************************************************************/\n';
  grunt.loadNpmTasks('grunt-replace');
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: true,
        banner: header
      },
      build: {
        files: {
          'build/<%= pkg.name %>-jw.min.js': ['build/*-jw.js'],
          'build/<%= pkg.name %>-bitmovin.min.js': ['build/*-bitmovin.js'],
          'build/<%= pkg.name %>-radiant.min.js': ['build/*-radiant.js']
        }
      }
    },
    concat: {
      options: {
        banner: header + '(function(global) {\nglobal.bitmovin = global.bitmovin || {};\n',
        footer: '\n})(this);',
        seperator: ';'
      },
      build: {
        files: {
          'build/<%= pkg.name %>-bitmovin.js': [
            'node_modules/javascript-state-machine/state-machine.js',
            'js/core/AnalyticsCall.js',
            'js/core/AnalyticsStateMachine.js',
            'js/core/LicenseCall.js',
            'js/core/Logger.js',
            'js/core/Utils.js',
            'js/adapters/bitanalytics-bitmovin.js',
            'js/core/Bitanalytics.js',
            'js/core/Events.js',
            'js/core/Players.js',
            'js/core/CDNProviders.js'
          ],
          'build/<%= pkg.name %>-jw.js': ['js/Prepend.js', 'node_modules/javascript-state-machine/state-machine.js', 'js/core/*.js', 'js/adapters/bitanalytics-jw.js'],
          'build/<%= pkg.name %>-radiant.js': ['js/Prepend.js', 'node_modules/javascript-state-machine/state-machine.js', 'js/core/*.js', 'js/adapters/bitanalytics-radiant.js']
        }
      }
    },
    watch: {
      files: ['Gruntfile.js', 'js/**/*.js'],
      tasks: ['eslint', 'concat']
    },
    eslint: {
      target: ['Gruntfile.js', 'js/**/*.js']
    },
    replace: {
      dist: {
        options: {
          patterns: patterns
        },
        files: [
          {
            expand: true,
            flatten: true,
            src: ['build/*.js'],
            dest: 'build/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['eslint', 'concat', 'uglify', 'replace']);
  grunt.registerTask('debug', ['eslint', 'concat', 'replace']);
  grunt.registerTask('lint', ['eslint']);
};
