module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: true,
        banner: '/*!- <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
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
        seperator: ';'
      },
      build: {
        files: {
          'build/<%= pkg.name %>-bitmovin.js': ['js/core/*.js', 'js/bitanalytics-core.js', 'js/adapters/bitanalytics-bitmovin.js'],
          'build/<%= pkg.name %>-jw.js': ['js/core/*.js', 'js/bitanalytics-core.js', 'js/adapters/bitanalytics-jw.js'],
          'build/<%= pkg.name %>-radiant.js': ['js/core/*.js', 'js/bitanalytics-core.js', 'js/adapters/bitanalytics-radiant.js'],
        }
      }
    },
    watch: {
      files: ['Gruntfile.js', 'js/**/*.js'],
      tasks: ['eslint', 'concat']
    },
    eslint: {
      target: ['Gruntfile.js', 'js/**/*.js']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['eslint', 'concat', 'uglify']);
  grunt.registerTask('debug', ['eslint', 'concat']);
  grunt.registerTask('lint', ['eslint']);
};
