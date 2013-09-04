var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Variables', function() {

    before(function(done) {
        this.timeout(5000);
        client.initDesign(done);
            
    });

    beforeEach(function(done) {
        this.timeout(5000);
        client.freshDesign(done);

    });

    after(function(done) {
        client.end(done);
    });

    // ---------- Cases ----------

    it("can't be created two-at-once", function(done) {
        this.timeout(5000)
        client
            .click('#variables .add')
            .assertNumberOfEditingNodes(1)
            .click('#variables .add')
            .assertNumberOfEditingNodes(1, done);

    });

    it('can\'t create with an existing name', function(done) {
        this.timeout(5000)
        client
            .click('#variables .add')
            .setValue('#variables .name input', 'a')
            .setValue('#variables .expression input', '1')
            .pause(500)
            .clickOnWorld(0,0,0)
            .click('#variables .add')
            .setValue('#variables .name input', 'a')
            .setValue('#variables .expression input', '2')
            .pause(500)
            .clickOnWorld(0,0,0)
            .hasClass('.vertex.editing', 'error', done)
    });

    it("can't be edited more than one at a time", function(done) {
        this.timeout(5000)
        client
            .click('#variables .add')
            .setValue('#variables .name input', 'a')
            .setValue('#variables .expression input', '1')
            .pause(500)
            .clickOnWorld(0,0,0)
            .click('#variables .add')
            .setValue('#variables .name input', 'b')
            .setValue('#variables .expression input', '2')
            .pause(500)
            .clickOnWorld(0,0,0)
            .assertNumberOfDisplayNodes(2)
            .click('#variables .a')
            .assertNumberOfDisplayNodes(1)
            .assertNumberOfEditingNodes(1)
            .click('#variables .b')
            .assertNumberOfDisplayNodes(1)
            .assertNumberOfEditingNodes(1, done)
    });

});