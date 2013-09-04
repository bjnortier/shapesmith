var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Workplane', function() {

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

    it('can have different snap values', function(done) {
        this.timeout(10000);
        client
            .click('.toolbar .settings')
            .clearElement('#dialog .gridsize')
            .setValue('#dialog .gridsize', '5')
            .click('#dialog .button')
            .click('.toolbar .point')
            .moveToWorld(3,3,0)
            .assertCoordinateEqual('.vertex.editing .coordinate', 5, 5, 0, done);
    });

    it('will not change the gridsize if there are errors', function(done) {
        this.timeout(10000);
        client
            .click('#dialog .settings')
            .clearElement('#dialog .gridsize')
            .setValue('#dialog .gridsize', '##')
            .click('#dialog .button')
            .hasClass('#dialog .gridsize', 'error', done)

    });


});