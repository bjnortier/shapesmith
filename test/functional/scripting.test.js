var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Scripting', function() {

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

    describe('Variables', function() {

        it('can be created and updated', function(done) {
            this.timeout(5000);
            client
                .assertExecuteSuccess('v = designer.createVariable("a","2")')
                .assertExecuteError('designer.createVariable("a","2")', 'validation')
                .assertExecuteSuccess('designer.updateVariable(v, "a", "5")', done)
        });


    })

    describe('Points', function(done) {

        it('can create from coordinates', function(done) {
            this.timeout(5000);
            client
                .assertExecuteSuccess('p = designer.createPoint(10,10,0)')
                .assertNumberOfDisplayNodes(1)
                .clickOnWorld(10,10,0)
                .assertNumberOfEditingNodes(1)
                .assertCoordinateEqual('.vertex.editing .coordinate', 10, 10, 0)
                .clickOnWorld(0,0,0)
                .assertExecuteSuccess('designer.updatePoint(p, 20,20,0)')
                .clickOnWorld(20,20,0)
                .assertNumberOfEditingNodes(1, done)

        })

    })

    describe('Polylines', function() {

        it('can create from coordinates', function(done) {  
            this.timeout(5000);
            client
                .assertExecuteError(
                    'designer.createPolyline(0)', 
                    'parameter is not an array')
                .assertExecuteSuccess('p = designer.createPolyline([[0,0,0],[10,10,0]])')
                .assertNumberOfDisplayNodes(1)
                .clickOnWorld(10,10,0)
                .assertNumberOfEditingNodes(3)
                .assertCoordinateEqual('.vertex.editing.point0 .coordinate', 0, 0, 0)
                .assertCoordinateEqual('.vertex.editing.point1 .coordinate', 10, 10, 0, done)

        });

        it('can create from points', function(done) {  
            this.timeout(5000);
            client
                .assertExecuteSuccess('p0 = designer.createPoint(0,0,0)')
                .assertExecuteSuccess('p1 = designer.createPoint(-10,0,10)')
                .assertExecuteSuccess('poly = designer.createPolyline([p0, p1])')
                .assertNumberOfDisplayNodes(3)
                .click('.polyline0 .name')
                .assertNumberOfDisplayNodes(2)
                .assertNumberOfEditingNodes(1, done)

        });

        it('can be edited by changing an implicit point', function(done) {
            this.timeout(5000);
            client
                .assertExecuteSuccess('polyline = designer.createPolyline([[0,0,0],[10,10,0]])')
                .assertExecuteError(
                    'designer.getPoint({})', 
                    'unknown geometry type')
                .assertExecuteError(
                    'designer.getPoint(polyline, 3)', 
                    'point index out of bounds [0,1]')
                .assertExecuteSuccess('point0 = designer.getPoint(polyline, 0)')
                .assertExecuteSuccess('point1 = designer.getPoint(polyline, 1)')
                .assertExecuteSuccess('designer.updatePoint(point1, 20, 20, 20)')
                .clickOnWorld(20,20,20)
                .assertNumberOfEditingNodes(3, done)

        });

    })

    describe('Extrusions', function() {

        it('can create from coordinates', function(done) {  
            this.timeout(5000);
            client
                .assertExecuteError(
                    'designer.createExtrusion(0)', 
                    'parameter is not an array')
                .assertExecuteSuccess('p = designer.createExtrusion([[0,0,0],[10,0,0]])')
                .assertNumberOfDisplayNodes(2)
                .clickOnWorld(5,0,1)
                .assertNumberOfEditingNodes(1)
                .assertNumberOfDisplayNodes(1, done);

        });

        it('can create from points', function(done) {  
            this.timeout(5000);
            client
                .assertExecuteSuccess('p0 = designer.createPoint(0,0,0)')
                .assertExecuteSuccess('p1 = designer.createPoint(0,10,0)')
                .assertExecuteSuccess('poly = designer.createExtrusion([p0, p1])')
                .assertNumberOfDisplayNodes(4)
                .click('.extrude0 .name')
                .assertNumberOfDisplayNodes(3)
                .assertNumberOfEditingNodes(1, done)

        });

    });

    describe('UndoRedo', function(done) {

        it('can undo scripted point creation', function(done) {
            this.timeout(5000);
            client
                .assertExecuteSuccess('p = designer.createPoint(10,10,0)')
                .assertNumberOfDisplayNodes(1)
                .back()
                .assertNumberOfDisplayNodes(0)
                .forward()
                .assertNumberOfDisplayNodes(1, done);

        })

    })

});