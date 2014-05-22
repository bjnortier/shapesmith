var client = require('./client').client;

describe('Polylines', function() {

    it('can be created on the workplane', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .assertNumberOfEditingNodes(2)
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .dblClickOnWorld(0,10,0)
            .click('.toolbar .select')
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(4, done);
    });

    it('ends the polyline when the first coordinate is clicked', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,0,0)
            .assertNumberOfDisplayNodes(4)
            .assertNumberOfEditingNodes(2)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(4)
            .assertNumberOfEditingNodes(0, done);
    });


    it('ends the polyline on double-click', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .dblClickOnWorld(0,10,0)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(4)
            .assertNumberOfEditingNodes(0, done);
    })

    it('can finish on an existing point', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(10,10,0)
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,0,0)
            .dblClickOnWorld(10,10,0)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(4, done)
    });


    it.skip('can edited by dragging the points', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,20,0)
            .clickOnWorld(10,0,0)
            .clickOnWorld(20,20,0)
            .clickOnWorld(20,0,0)
            .clickOnWorld(30,20,0)
            .dblClickOnWorld(30,0,0)
            .click('.toolbar .select')
            .moveToWorld(0,0,0)
            .buttonDown()
            .moveToWorld(0,-20,0)
            .moveToWorld(0,-20,0)
            .assertCoordinateEqual('.vertex.editing .coordinate', 0, -20, 0, done)
    });

    it('can be cancelled when an implicit point is shared', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(20,10,0)
            .clickOnWorld(10,10,0)
            .click('.toolbar .select')
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(0, done);
    });

    it('can be edited', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,0,0)
            .click('.toolbar .select')
            .dblClickOnWorld(10,10,0)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', 0,0,0)
            .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 10,10,0)
            .assertCoordinateEqual('.vertex.editing.point2 .coordinate', 0,10,0)
            .moveToWorld(10,10,0)
            .dragToWorld(20,20,0)
            .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 20,20,0)
            .clickOnWorld(30,30,0)
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(4, done)
    });

    it.skip('can be edited by selecting another one', function(done) {
        this.timeout(10000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,0,0)
            .clickOnWorld(30,0,0)
            .clickOnWorld(30,30,0)
            .clickOnWorld(0,30,0)
            .clickOnWorld(30,0,0)
            .click('.toolbar .select')
            .dblClickOnWorld(10,10,0)
            .assertNumberOfEditingNodes(4)
            .assertNumberOfDisplayNodes(1)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', 0,0,0)
            .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 10,10,0)
            .assertCoordinateEqual('.vertex.editing.point2 .coordinate', 0,10,0)
            .dblClickOnWorld(30,30,0)
            .assertNumberOfEditingNodes(4)
            .assertNumberOfDisplayNodes(1)
            .assertCoordinateEqual('.vertex.editing.point4 .coordinate', 30,0,0)
            .assertCoordinateEqual('.vertex.editing.point5 .coordinate', 30,30,0)
            .assertCoordinateEqual('.vertex.editing.point6 .coordinate', 0,30,0)
            .clickOnWorld(-10,-10,0)
            .pause(500)
            .assertNumberOfEditingNodes(0)
            .assertNumberOfDisplayNodes(2, done)
    });

    it.skip('can share points', function(done) {
        this.timeout(10000);
        client
            .click('.toolbar .polyline .icon32')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,0,0)
            .clickOnWorld(20,20,0)
            .clickOnWorld(0,0,0)
            .clickOnWorld(20,0,0)
            .clickOnWorld(20,20,0)
            .click('.toolbar .select')
            .dblClickOnWorld(0,0,0)
            .moveToWorld(0,0,0)
            .dragToWorld(-10,-10,0)
            .click('.polyline0 .name')
            .assertNumberOfEditingNodes(4)
            .assertNumberOfDisplayNodes(1)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', -10,-10,0)
            .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 10,10,0)
            .assertCoordinateEqual('.vertex.editing.point2 .coordinate', 0,10,0)
            .click('.polyline1 .name')
            .assertNumberOfEditingNodes(4)
            .assertNumberOfDisplayNodes(1)
            .assertCoordinateEqual('.vertex.editing.point4 .coordinate', 20,20,0)
            .assertCoordinateEqual('.vertex.editing.point0 .coordinate', -10,-10,0)
            .assertCoordinateEqual('.vertex.editing.point6 .coordinate', 20,0,0, done)
    });


    it('has creation hints', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline .icon32')
            .assertTextEqual('#hint', 'Click to add a corner.')
            .clickOnWorld(0,0,0)
            .assertTextEqual('#hint', 'Click to add a corner.')
            .clickOnWorld(10,0,0)
            .assertTextEqual('#hint', 'Click to add a corner. Double-click to end.')
            .clickOnWorld(10,10,0)
            .assertTextEqual('#hint', 'Click to add a corner. Double-click or click on first corner to end.', done)
    });



});

