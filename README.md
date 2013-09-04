# Shapesmith[.next]

Welcome to Shapesmith.next, the next generation EXPERIMENTAL implementation of Shapesmith. 

You can find the original, stable, version at [http://github.com/bjnortier/shapesmith](http://github.com/bjnortier/shapesmith)

## What is Shapesmith?

Shapemsith is an

 * Open Source
 * parametric
 * full-stack Javascript
 * 3D modelling application
 * for 3D printing

## Installation

### Requirements

1. Nodejs with NPM
1. Grunt-CLI
1. A WebGL-capable browser

I recommend using [Homebrew](http://mxcl.github.com/homebrew/) to install nodejs. When you have homebrew, install nodejs (npm is included):
     
    $ brew install node

### Install grunt-cli and nodemon (nodemon is used suring development to restart on code changes)

    $ npm install -g grunt-cli nodemon

### Install the dependencies

    $ npm install

### Run the app

    $ bin/start

    DEBUG: Running node-supervisor with
    DEBUG:   program 'src/api/app.js'
    DEBUG:   --watch '.'
    DEBUG:   --ignore 'undefined'
    DEBUG:   --extensions 'node|js'
    DEBUG:   --exec 'node'
    
    DEBUG: Starting child process with 'node src/api/app.js'
    DEBUG: Watching directory '/Users/bjnortier/development/ss2' for changes.
    
    
    configuration:
    --------------
    baseUrl:      /Users/bjnortier/development/ss2/src
    disk db path: /Users/bjnortier/development/ss2/db/
    --------------
    server started on :8000

### Open your browser

    http://localhost:8000







