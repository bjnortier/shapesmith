var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Undo/Redo', function() {

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

    it('can undo/redo point creation', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(0,0,0) // point0
            .clickOnWorld(10,10,0) // point1
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(2)
            .back()
            .assertNumberOfDisplayNodes(1)
            .back()
            .assertNumberOfDisplayNodes(0)
            .forward()
            .assertNumberOfDisplayNodes(1)
            .forward()
            .assertNumberOfDisplayNodes(2, done)
    })

    it('can undo/redo polyline creation', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,0,0)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(1)
            .back()
            .assertNumberOfDisplayNodes(0)
            .forward()
            .assertNumberOfDisplayNodes(1, done);
    })

    it("doesn't create a command when the SHA is unchanged", function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(0,0,0)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(1)
            .click('.point0')
            .assertNumberOfEditingNodes(1)
            .clickOnWorld(10,10,10)
            .back()
            .pause(100)
            .assertNumberOfDisplayNodes(0, done)
    })

    it("can undo/redo geometry with implicit children (a polyline)", function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .dblClickOnWorld(20,20,0)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(1)
            .back()
            .assertNumberOfDisplayNodes(0)
            .forward()
            .assertNumberOfDisplayNodes(1, done);
    })

    it("can undo/redo editing a polyline as a whole", function(done) {
        this.timeout(10000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .dblClickOnWorld(20,20,0)
            .click('.toolbar .select')
            .clickOnWorld(0,0,0)
            .moveToWorld(0,0,0)
            .dragToWorld(-10,-10,0)
            .moveToWorld(20,20,0)
            .dragToWorld(20,0,0)
            .clickOnWorld(-20,-20,0)
            .back()
            .clickOnWorld(0,0,0)
            .assertNumberOfEditingNodes(3)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', 0,0,0)
            .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 20,20,0)
            .clickOnWorld(15,15,0)
            .forward()
            .clickOnWorld(-10,-10,0)
            .assertNumberOfEditingNodes(3)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', -10,-10,0)
            .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 20,0,0, done)
    })

});

