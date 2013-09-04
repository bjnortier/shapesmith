var client = require('./client').client;

describe('Points', function() {

    it('can be created with subsequent mouse clicks', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .assertNumberOfEditingNodes(1)
            .moveToWorld(20,10,0)
            .assertCoordinateEqual('.vertex.editing .coordinate', 20, 10, 0)
            .clickOnWorld(20,10,0)
            .assertNumberOfDisplayNodes(1)
            .assertNumberOfEditingNodes(1)
            .clickOnWorld(0,0,0)
            .clickOnWorld(0,10,0)
            .clickOnWorld(0,20,0)
            .click('.toolbar .select')
            .assertNumberOfDisplayNodes(4, done);
    });

    it('can be edited with dragging', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(10,10,0)
            .click('.toolbar .select')
            .moveToWorld(10,10,0)
            .buttonDown()
            .moveToWorld(20,20,0)
            .moveToWorld(20,20,0)
            .assertCoordinateEqual('.vertex.editing .coordinate', 20, 20, 0)
            .buttonUp()
            .assertNumberOfDisplayNodes(1, done);
    });


    it('can be edited by double clicking', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .clickOnWorld(10,10,0)
            .click('.toolbar .select')
            .pause(500)
            .dblClickOnWorld(10,10,0)
            .assertNumberOfDisplayNodes(0)
            .assertNumberOfEditingNodes(1, done);
    });

    it('has coordinates displayed', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .moveToWorld(10,10,0)
            .assertTextEqual('.dimensions.coordinate', '(10,10,0)')
            .clickOnWorld(0,0,0)
            .assertTextEqual('.dimensions.coordinate', '(0,0,0)', done);

    })

});
