// JS Hint options
var JSHINT_BROWSER = {
  browser: true,
  es5: true
};

var JSHINT_NODE = {
  node: true,
  es5: true
};

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    files: {
      test: {
        all: ['./test/**/*.js']
      },
    },
    test: {
      lib: '<config:files.test.all>'
    }
  });

  grunt.registerTask('default', 'test');
};