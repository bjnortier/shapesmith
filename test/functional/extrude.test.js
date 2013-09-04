var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Extrusions', function() {

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

    it('can be created from a polyline', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .dblClickOnWorld(10,0,0)
            .click('.toolbar .select')
            .clickOnWorld(0,0,0)
            .click('.toolbar .extrude')
            .assertNumberOfDisplayNodes(1)
            .assertNumberOfEditingNodes(1)
            .moveToWorld(0,0,11)
            .dragToWorld(0,0,21)
            .assertValueEqual('.vertex.editing.extrude0 .height', '20')
            .clickOnWorld(0,-10,0)
            .assertNumberOfDisplayNodes(2)
            .assertNumberOfEditingNodes(0, done);
    });

    it('can be edited by dragging the polyline points or the height anchors', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .dblClickOnWorld(10,0,0)
            .click('.toolbar .select')
            .clickOnWorld(0,0,0)
            .click('.toolbar .extrude')
            .clickOnWorld(0,-10,0)
            .moveToWorld(0,0,0)
            .dragToWorld(-10,0,0)
            .clickOnWorld(-9,0,9)
            .assertNumberOfEditingNodes(1)
            .moveToWorld(-10,0,11)
            .dragToWorld(-10,0,21)
            .assertValueEqual('.vertex.editing.extrude0 .height', '20', done)
    });    

});