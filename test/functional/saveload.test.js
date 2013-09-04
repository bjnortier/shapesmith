var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Save/Load', function() {

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

    it('can save and load a point', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(0,0,0)
            .click('.toolbar .select')
            .click('.toolbar .save')
            .waitForTextEqual('#hint', 'Saved.', function() {
                client
                    .url(client.baseUrl + '/local/designs/')
                    .findElementContaining('.design', client.testDesignName, function(elementId) {
                        client.elementIdClick(elementId, function() {
                            client.waitForMainDone(function() {
                                client.assertNumberOfDisplayNodes(1, done);
                            });
                        })
                    });
            });
    });


});