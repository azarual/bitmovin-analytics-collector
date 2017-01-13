module.exports = function(grunt) {
  var patterns = [{
    match: /\{\{VERSION\}\}/g,
    replacement: '<%= pkg.version %>'
  }];
  var header =
        '/****************************************************************************\n' +
        ' * Copyright (C) ' + new Date().getFullYear() + ', Bitmovin, Inc., All Rights Reserved\n' +
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
          'build/release/<%= pkg.name %>.min.js': ['build/debug/*.js']
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
          'build/debug/<%= pkg.name %>.js': [
            'js/core/Bitanalytics.js',
            'js/core/AnalyticsStateMachineFactory.js',
            'js/analyticsStateMachines/BitmovinAnalyticsStateMachine.js',
            'js/analyticsStateMachines/Bitmovin7AnalyticsStateMachine.js',
            'js/core/AdapterFactory.js',
            'js/adapters/BitmovinAdapter.js',
            'js/adapters/Bitmovin7Adapter.js',
            'js/utils/PlayerDetector.js',
            'js/utils/AnalyticsCall.js',
            'js/utils/LicenseCall.js',
            'js/utils/Logger.js',
            'js/utils/Utils.js',
            'js/enums/Events.js',
            'js/enums/Players.js',
            'js/enums/CDNProviders.js',
            'node_modules/javascript-state-machine/state-machine.js'
          ]
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
            src: ['build/debug/*.js'],
            dest: 'build/debug'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('debug', ['eslint', 'concat', 'replace']);
  grunt.registerTask('release', ['eslint', 'concat', 'replace', 'uglify']);
  grunt.registerTask('lint', ['eslint']);
};
