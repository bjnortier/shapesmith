var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Refresh', function() {

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

    it('can load a point', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .point')
            .waitForUrlChange(
                function() { client.clickOnWorld(0,0,0); },
                function() {
                    client
                        .reloadCommit(function() {
                            client.assertNumberOfDisplayNodes(1, done);
                        });
                });
    });

    it('can load a polyline', function(done) {
        this.timeout(5000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .clickOnWorld(10,10,0)
            .waitForUrlChange(
                function() { client.dblClickOnWorld(20,20,0); },
                function() {
                    client
                        .reloadCommit(function() {
                            client.assertNumberOfDisplayNodes(1, done);
                        });
                });

    });


    it("can load, edit and refresh a polyline", function(done) {
        this.timeout(10000);
        client
            .click('.toolbar .polyline')
            .clickOnWorld(0,0,0)
            .waitForUrlChange(
                function() { client.dblClickOnWorld(20,20,0); },
                function() {
                    client
                        .reloadCommit(function() {
                            client
                                .assertNumberOfDisplayNodes(1)
                                .moveToWorld(0,0,0)
                                .waitForUrlChange(
                                    function() { client.dragToWorld(-10,-10,0); },
                                    function() {
                                        client.reloadCommit(function() {
                                            client
                                                .assertNumberOfDisplayNodes(1)
                                                .clickOnWorld(-10,-10,0)
                                                .assertNumberOfEditingNodes(3)
                                                .assertCoordinateEqual(
                                                    '.vertex.editing.point0 .coordinate', -10,-10,0)
                                                .assertCoordinateEqual(
                                                    '.vertex.editing.point1 .coordinate', 20,20,0, done)
                                        });
                                    });
                            });
                });
    });


});