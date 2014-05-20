var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Geometry toolbar', function() {

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

    it('is on "select" by default', function(done) {
        client.hasClass('.toolbar .select', 'active', done);
    });

    it('has mutually exclusive items', function(done) {
        client
            .click('.toolbar .point')
            .hasClass('.toolbar .point', 'active')
            .doesntHaveClass('.toolbar .select', 'active')
            .click('.toolbar .polyline')
            .hasClass('.toolbar .polyline', 'active')
            .doesntHaveClass('.toolbar .point', 'active')
            .doesntHaveClass('.toolbar .select', 'active')
            .click('.toolbar .select')
            .hasClass('.toolbar .select', 'active')
            .doesntHaveClass('.toolbar .point', 'active', done);

    });

});
