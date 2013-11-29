[![Build Status](https://travis-ci.org/bjnortier/shapesmith.next.png?branch=master)](https://travis-ci.org/bjnortier/shapesmith.next)

# Shapesmith.next

you can test it live at [http://glacial-reef-8810.herokuapp.com/](http://glacial-reef-8810.herokuapp.com/)

this fork has integrate modification for Heroku integretion (developpement profile)

Welcome to Shapesmith.next, the next generation implementation of Shapesmith. 

You can find the original, stable, version at [http://github.com/bjnortier/shapesmith](http://github.com/bjnortier/shapesmith)

## What is Shapesmith?

Shapemsith is a:
 
 * HTML5
 * Open Source
 * Parametric
 * 3D modelling application

And it is also:

 * Aimed at 3D printing
 * Written in pure Javascript 

## Installation

### Requirements

1. Nodejs > 0.10 (and NPM)
1. grunt-cli and nodemon
1. A WebGL-capable browser

On a Mac, I recommend using [Homebrew](http://mxcl.github.com/homebrew/) to install nodejs. When you have homebrew, install nodejs (npm is included):
     
    $ brew install node

On Linux, there are different [instructions for your distribution](https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager#ubuntu-mint).
 

### Install the dependencies

    $ cd shapesmith.next

    # If you're using Homebrew you won't need the sudo command
    $ [sudo] npm install -g grunt-cli nodemon
    [...]
    
    $ npm install
    [...]
    
### Run the tests 

    $ grunt test
    [...]
      63 tests complete (66 ms)
   
    Done, without errors.

### Run the app

    $ npm start
    
    > shapesmith@0.11.0 app /Users/bjnortier/development/shapesmith.next
    > nodemon src/api/server.js
    
    6 Oct 23:13:36 - [nodemon] v0.7.8
    6 Oct 23:13:36 - [nodemon] to restart at any time, enter `rs`
    6 Oct 23:13:36 - [nodemon] watching: /Users/bjnortier/development/shapesmith.next
    6 Oct 23:13:36 - [nodemon] starting `node src/api/app.js`
    
        .                           .  .   
    ,-. |-. ,-. ,-. ,-. ,-. ,-,-. . |- |-. 
    `-. | | ,-| | | |-' `-. | | | | |  | | 
    `-' ' ' `-^ |-' `-' `-' ' ' ' ' `' ' ' 
                '                          
    
    configuration:
    --------------
    environment:  development
    port:         8000
    dbtype:       sqlite
    server started on :8000

### Open your browser

    http://localhost:8000
    
## LICENSE

MIT







