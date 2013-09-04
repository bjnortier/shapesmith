var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Deletion', function() {

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

    it('can delete a point', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(5,5,0)
            .click('.toolbar .select')
            .click('.point0 .delete')
            .assertNumberOfDisplayNodes(0)
            .back()
            .assertNumberOfDisplayNodes(1)
            .click('.point0 .name')
            .assertNumberOfEditingNodes(1)
            .click('.point0 .delete')
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(0, done);
    });

    it('can delete a polyline', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .clickOnWorld(0,5,0)
            .clickOnWorld(5,5,0)
            .clickOnWorld(0,0,0)
            .click('.toolbar .select')
            .click('.polyline0 .delete')
            .assertNumberOfDisplayNodes(0)
            .back()
            .assertNumberOfDisplayNodes(1)
            .click('.polyline0 .name')
            .click('.polyline0 .delete')
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(0, done);
    });

    it('can delete an extrusion', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .dblClickOnWorld(0,10,0)
            .click('.toolbar .select')
            .click('.polyline0 .name')
            .click('.toolbar .extrude')
            .clickOnWorld(0,-10,0)
            .click('.extrude0 .delete')
            .assertNumberOfDisplayNodes(1)
            .back()
            .assertNumberOfDisplayNodes(2)
            .click('.extrude0 .name')
            .assertNumberOfEditingNodes(1)
            .click('.extrude0 .delete')
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(1, done);
    });


    it('can delete a variable', function(done) {
        this.timeout(5000)
        client
            .click('#variables .add')
            .assertNumberOfEditingNodes(1)
            .setValue('#variables .name input', 'a')
            .setValue('#variables .expression input', '1')
            .clickOnWorld(0,0,0)
            .assertNumberOfDisplayNodes(1)
            .click('#variables .a .delete')
            .assertNumberOfDisplayNodes(0)
            .back()
            .click('#variables .a')
            .assertNumberOfEditingNodes(1)
            .click('.editing .delete')
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(0, done);
    });

    it('can delete shared points', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,0,0)
            .clickOnWorld(20,20,0)
            .clickOnWorld(0,0,0)
            .clickOnWorld(20,0,0)
            .clickOnWorld(20,20,0)
            .click('.toolbar .select')
            .click('.polyline0 .delete')
            .click('.polyline1 .name')
            .assertCoordinateEqual('.vertex.editing.point4 .coordinate', 20,20,0)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', 0,0,0)
            .assertCoordinateEqual('.vertex.editing.point6 .coordinate', 20,0,0, done)
    });


});