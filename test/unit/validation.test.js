define(['geomnode', 'geometrygraph'],
  function(GeomNode, GeometryGraph) {

    var graph = new GeometryGraph.Graph();

    describe('Validation', function() {

      it('can validate a workplane', function() {

        var v = new GeomNode.Workplane();
        assert.isTrue(graph.validate(v));

      });

      it('can validate a variable', function() {

        var v = new GeomNode.Variable({name: 'a', parameters: {expression: '1'}});

        var result = graph.validate(v);
        assert.isTrue(result);
        assert.deepEqual(v.errors, {});

        delete v.name;
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {name: 'not a string'});

        v.name = '';
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {name: 'empty'});

        v.name = 'a';
        delete v.parameters.expression;
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {'expression': 'missing'});

        v.name = 'a';
        v.parameters.expression = 'x';
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {'expression': 'invalid expression: \'x\''});

      });

      it('can validate a point', function() {
        var v = new GeomNode.Point();

        var result = graph.validate(v);
        assert.isTrue(result);
        assert.deepEqual(v.errors, {});

        delete v.parameters;
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {'parameters': 'missing'});

        v.parameters = {};
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {'parameters.coordinate': 'missing'});

        v.parameters.coordinate = {y:'1',z:'1'};
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {'x': 'missing'});
      });

      it('can validate an extrude', function() {
        var v = new GeomNode.Extrude();

        var result = graph.validate(v);
        assert.isTrue(result);
        assert.deepEqual(v.errors, {});

        delete v.parameters.vector.u;
        result = graph.validate(v);
        assert.isFalse(result);
        assert.deepEqual(v.errors, {'vector.u': 'missing'});
      });

    });

  });
