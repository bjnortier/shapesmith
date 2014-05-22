var path = require('path');

module.exports = function(grunt) {

  grunt.initConfig({

    jshint: {
      options: {
        jshintrc: '.jshintrc',
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      api: {
        src: [
          'src/api/**/*.js',
        ]
      },
      ui: {
        src: [
          'src/casgraph/**/*.js',
          'src/inspect/**/*.js',
          'src/latheapi/**/*.js',
          'src/layers/**/*.js',
          'src/modelviews/**/*.js',
          'src/scripting/**/*.js',
          'src/toolbars/**/*.js',
          'src/*.js',
        ],
      },
      unit: {
        src: ['test/unit*.js', 'test/unit/**/*.js'],
      },
    },

    less: {
      all: {
        files: {
          './static/css/designs.css'     : 'static/css/less/designs.less',
          './static/css/signinsignup.css': 'static/css/less/signinsignup.less',
          './static/css/landing.css'     : 'static/css/less/landing.less',
          './static/css/grid.css'        : 'static/css/less/grid.less',
          './static/css/shapesmith.css'  : 'static/css/less/shapesmith.less',
        },
      },
    },

    watch: {
      gruntfile: {
        files: '<%= jshint.gruntfile.src %>',
        tasks: ['jshint:gruntfile']
      },
      api: {
        files: '<%= jshint.api.src %>',
        tasks: ['jshint:api', 'simplemocha:unit'],
      },
      ui: {
        files: '<%= jshint.ui.src %>',
        tasks: ['jshint:ui', 'simplemocha:unit']
      },
      unit: {
        files: '<%= jshint.unit.src %>',
        tasks: ['jshint:unit', 'simplemocha:unit']
      },
      less: {
        files: 'static/css/**/*.less',
        tasks: ['less'],
      }
    },

    simplemocha: {
      options: {
        timeout: 3000,
        slow: 5000,
        ignoreLeaks: false,
        ui: 'bdd',
        reporter: 'spec',
        path: 'test'
      },

      unit: {
        src: 'test/unit.js',
      },
      functional: {
        src: [
          'test/functional/points.test.js',
          'test/functional/polylines.test.js',
        ],
      },
    },

    requirejs: {
      compile: {
        options: {
          appDir: ".",
          baseUrl: "src",
          dir: "build",
          optimize: "none",
          mainConfigFile: "src/main.ui.js",
          modules: [
            {
              name: "main.ui"
            },
            {
              name: "main.designs",
            },
            {
              name: "worker",
            }
          ],
          fileExclusionRegExp: /(^\.|^release.*$|^bin$|^artwork$|^.*.db$|^.db$|^test|^grunt.*$|^mocha$|^chai$|^webdriverjs$)/,
        }
      }
    },

    uglify: {
      main_ui: {
        files: {
          'build/src/main.ui.js': ['build/src/main.ui.js']
        }
      },
      main_designs: {
        files: {
          'build/src/main.designs.js': ['build/src/main.designs.js']
        }
      },
      worker: {
        files: {
          'build/src/worker.js': ['build/src/worker.js']
        }
      },
    },

    express: {
      server: {
        options: {
          port: 8001,
          server: path.resolve('./src/api/server.js')
        }
      }
    },

    exec: {
      fix_worker: {
        cmd: 'echo "importScripts(\'/lib/require.js\');" > /tmp/worker.js; cat build/src/worker.js >> /tmp/worker.js; mv /tmp/worker.js build/src/worker.js '
      }
    },

  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-express');
  grunt.loadNpmTasks('grunt-exec');

  // Unit testing
  grunt.registerTask('unit', ['jshint:unit', 'simplemocha:unit']);
  grunt.registerTask('test', ['jshint:api', 'jshint:ui', 'unit']);
  // Functional testing - requires a running server
  process.env['app_env'] = 'functional';
  grunt.registerTask('functional', ['express', 'simplemocha:functional']);

  // Build the single JS file
  grunt.registerTask('build', ['requirejs', 'exec:fix_worker', 'uglify']);

};
