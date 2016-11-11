module.exports = function(grunt) {
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
          'build/<%= pkg.name %>-bitmovin.js': ['js/bitanalytics-core.js', 'js/bitanalytics-bitmovin.js'],
          'build/<%= pkg.name %>-jw.js': ['js/bitanalytics-core.js', 'js/bitanalytics-jw.js'],
          'build/<%= pkg.name %>-radiant.js': ['js/bitanalytics-core.js', 'js/bitanalytics-radiant.js']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  //grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.registerTask('default', ['concat', 'uglify']);
};
