var chai = require('chai'),
    assert = chai.assert,
    client = require('./client').client;
chai.Assertion.includeStack = true;

describe('Graph view', function() {

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

    it('will maintain geometry row index on editing', function(done) {
        this.timeout(10000);
        client
            .click('.toolbar .point')
            .clickOnWorld(0,0,0)
            .clickOnWorld(20,20,0)
            .click('.toolbar .select')
            .click('#geometry .point0')
            .assertTextEqual('.vertex:nth-child(2) .title', 'point0')
            .assertTextEqual('.vertex:nth-child(3) .title', 'point1')
            .clickOnWorld(0,0,0)
            .click('#geometry .point1')
            .assertTextEqual('.vertex:nth-child(2) .title', 'point0')
            .assertTextEqual('.vertex:nth-child(3) .title', 'point1', done);
    });   

    it('will maintain variable row index on editing', function(done) {
        this.timeout(10000);
        client
            .click('#variables .add')
            .setValue('#variables input.var', 'a')
            .setValue('#variables input.expr', '1')
            .pause(500)
            .clickOnWorld(0,0,0)
            .click('#variables .add')
            .setValue('#variables input.var', 'b')
            .setValue('#variables input.expr', '2')
            .pause(500)
            .clickOnWorld(0,0,0)
            .click('#variables .a')
            .assertValueEqual('#variables tr:nth-child(2) .name .field', 'a')
            .assertTextEqual('#variables tr:nth-child(3) .name', 'b')
            .pause(500)
            .clickOnWorld(0,0,0)
            .click('#variables .b')
            .assertTextEqual('#variables tr:nth-child(2) .name', 'a')
            .assertValueEqual('#variables tr:nth-child(3) .name .field', 'b', done);
    });               


});