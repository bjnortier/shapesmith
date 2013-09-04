var remote = require('webdriverjs').remote,
    chai = require('chai'),
    http = require('http'),
    assert = chai.assert;
chai.Assertion.includeStack = true;

var client = remote({
    logLevel: 'silent',
    desiredCapabilities:{
        browserName:"chrome",
    },
});
client.baseUrl = 'http://localhost:8001';
client.testDesignName = '__test__'

before(function(done) {
    this.timeout(20000);
    client.initDesign(done);
        
});

beforeEach(function(done) {
    this.timeout(20000);
    client.freshDesign(done);

});

after(function(done) {
    this.timeout(5000)
    client.end(done);
});

client.addCommand('initDesign', function(callback) {
    var r = http.request({
        host: 'localhost',
        port: 8001,
        path: '/_api/local/' + encodeURIComponent(client.testDesignName),
        method: 'PUT',
    }, function(res) {
        client.init();
        callback();
    });
    r.end();
});

client.addCommand('freshDesign', function(callback) {
    this    
        .url(client.baseUrl + '/_ui/local/' + encodeURIComponent(client.testDesignName) + '/modeller?commit=51ba39e8fdd07321b190226727022c35649d8da4&noFadein=true')
        .waitForMainDone(function() {
            this.click('.toolbar .expander.hidden')
            callback();
        });
});

client.addCommand('waitForUrlChange', function(commitFn, callback) {
    client.url(function(result) {
        var from = result.value;
        commitFn();

        var waitForUrlChange = function() {
            var current = client.url(function(result) {
                if (result.value === from) {
                    setTimeout(waitForUrlChange, 100);
                } else {
                    callback();
                }
            })
        }
        waitForUrlChange();
    });
});

client.addCommand('waitForMainDone', function(callback) {
    var waitForDoneFn = function() {
        client.execute('return globals.loadDone', function(result) {
            if (result.value === true) {
                callback();
            } else {
                setTimeout(waitForDoneFn, 100);
            }
        });
    }
    waitForDoneFn();
});

client.addCommand('assertExecuteSuccess', function(script, callback) {
    client.execute(script, function(result) {
        assert.equal(result.status, 0, result.value && result.value.message)
        callback();
    });
});

client.addCommand('assertExecuteError', function(script, expectedResult, callback) {
    client.execute(script, function(result) {
        var lines = result.value.message.split('\n');
        assert.isArray(/Script execution failed.*/.exec(lines[0]), 'No JS error');
        var match = /(.*)\(WARNING: The server did not provide any stacktrace information\)/.exec(lines[1])
        assert.isArray(match, 'Unmatched error message' + lines[0]);
        assert.deepEqual(match[1].trim(), expectedResult);
        callback();
    });
});

client.addCommand('waitForTextEqual', function(selector, text, callback) {
    var waitForFn = function() {
        client.getText(selector, function(result) {
            if (result.value === text) {
                callback();
            } else {
                setTimeout(waitForFn, 100);
            }
        });
    }
    waitForFn();
});

client.addCommand('waitForElement', function(selector, callback) {
    var waitForFn = function() {
        client.element('css selector', selector, function(result) {
            var element = result.value.ELEMENT;
            if (result.value !== -1) {
                callback();
            } else {
                setTimeout(waitForFn, 100);
            }
        });
    }
    waitForFn();
});

client.addCommand('reloadCommit', function(callback) {
    this    
        .url(function(result) {
            this
                .url(result.value + '&noFadein=true')
                .waitForMainDone(callback)

        });
});

client.addCommand('assertTextEqual', function(selector, text, callback) {
    this.getText(selector, function(result) {
        assert.equal(result.value, text, selector);
        callback();
    });
});

client.addCommand('assertValueEqual', function(selector, text, callback) {
    this.getValue(selector, function(result) {
        assert.equal(result, text, selector);
        callback();
    });
});

client.addCommand('assertValueMatch', function(selector, regex, callback) {
    this.getValue(selector, function(result) {
        assert.match(result, regex, selector);
        callback();
    });
});

client.addCommand('hasClass', function(selector, clazz, callback) {
    this.getAttribute(selector, 'class', function(result) {
        assert.include(result, clazz);
        callback();
    });
});

client.addCommand('doesntHaveClass', function(selector, clazz, callback) {
    this.getAttribute(selector, 'class', function(result) {
        assert.isTrue(result.indexOf(clazz) === -1);
        callback();
    });
});

client.addCommand('assertCSSEqual', function(selector, property, expected, callback) {
    this.getCssProperty(selector, property, function(result) { 
        assert.equal(result, expected);
        callback();
    });
});

client.addCommand('moveToWorld', function(x,y,z, callback) {
    this.execute('return SS.toScreenCoordinates('+x+','+y+','+z+')', function(result) {
        var xOffset = Math.round(result.value.x);
        var yOffset = Math.round(result.value.y);
        client.element('css selector', '#scene', function(result) {
            var element = result.value.ELEMENT;
            client
                .moveTo(element, xOffset, yOffset, callback)
        });
    });
});

// Double the moveTo since our drag requires two moves to initiate
client.addCommand('dragToWorld', function(x,y,z, callback) {
    this
        .buttonDown()
        .moveToWorld(x,y,z)
        .moveToWorld(x,y,z)
        .buttonUp(callback)
});

client.addCommand('clickOnWorld', function(x,y,z, callback) {
    this
        .moveToWorld(x,y,z)
        .buttonDown()
        .buttonUp(callback);
});

client.addCommand('dblClickOnWorld', function(x,y,z, callback) {
    this
        .moveToWorld(x,y,z)
        .doDoubleClick(callback)
});

client.addCommand('assertCoordinateEqual', function(selector, x, y, z, callback) {
    this
        .assertValueEqual(selector + ' .x', x)
        .assertValueEqual(selector + ' .y', y)
        .assertValueEqual(selector + ' .z', z, callback);
});

client.addCommand('assertCoordinateMatch', function(selector, x, y, z, callback) {
    this
        .assertValueMatch(selector + ' .x', x)
        .assertValueMatch(selector + ' .y', y)
        .assertValueMatch(selector + ' .z', z, callback);
});

client.addCommand('getEditingVertexName', function(callback) {
    this.getText('.vertex.editing .title .name', function(result) {
        callback(result.value);
    });
});

client.addCommand('assertNumberOfElements', function(selector, expectedLength, callback) {
    this.elements('css selector', selector, function(result) {
        assert.equal(result.value.length, expectedLength);
        callback();
    });
});

client.addCommand('assertNumberOfEditingNodes', function(expectedLength, callback) {
    this.elements('css selector', '#graphs .vertex.editing', function(result) {
        assert.equal(result.value.length, expectedLength);
        callback();
    });
});

client.addCommand('assertNumberOfDisplayNodes', function(expectedLength, callback) {
    this.elements('css selector', '#graphs .vertex.display', function(result) {
        assert.equal(result.value.length, expectedLength);
        callback();
    });
});

client.addCommand('findElementContaining', function(selector, text, callback) {
    this.elements('css selector', selector, function(r1) {
        r1.value.forEach(function(v) {
            var elementId = v.ELEMENT;
            client.elementIdText(elementId, function(r2) {
                if (r2.value === text) {
                    callback(elementId);
                }
            });
        });
    });
});

exports.client = client;