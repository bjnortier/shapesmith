define(['variablegraph'], function(variableGraph) {

  describe('Variables', function() {

    var graph;

    beforeEach(function() {
      graph = new variableGraph.Graph();
    });

    // ---------- Cases ----------

    it('can evaluate expressions without variables', function() {

      assert.equal(graph.evaluate(55), 55);
      assert.equal(graph.evaluate('1 + 2'), 3);
      assert.equal(graph.evaluate('1/2'), 0.5);
      assert.equal(graph.evaluate('PI').toFixed(5), '3.14159');

      assert.throws(function() {
        graph.evaluate('$%^&*(');
      }, variableGraph.ParseError);

      assert.throws(function() {
        graph.evaluate('');
      }, variableGraph.ParseError);


    });

    it('throws an error if a undefined variable is used', function() {

      try {
        graph.evaluate('x');
        assert.fail();
      } catch (e) {
        assert.isTrue(e instanceof variableGraph.UnknownVariableError);
        assert.equal(e.message, 'x');
      }
    });

    it('can evaluate a defined variable', function() {

      graph.add(variableGraph.createVertex('a', '1'));
      assert.equal(graph.evaluate('a'), 1);

    });

    it('can evaluate a graph of variables', function() {

      graph.add(variableGraph.createVertex('a', '1'));
      graph.add(variableGraph.createVertex('b', 'a + 1'));
      graph.add(variableGraph.createVertex('c', 'b/4'));

      assert.equal(graph.evaluate('a'), 1);
      assert.equal(graph.evaluate('b'), 2);
      assert.equal(graph.evaluate('c'), 0.5);

    });

    it('can determine if a potential new variable is valid', function() {

      var a = variableGraph.createVertex('a', '1');
      var b = variableGraph.createVertex('b', '1*5');

      assert.isTrue(graph.canAdd(a));
      assert.isTrue(graph.canAdd(b));

      graph.add(a);
      var a2 = variableGraph.createVertex('a', '15*5');
      assert.isFalse(graph.canAdd(a2));

      assert.isFalse(graph.canAdd(variableGraph.createVertex('c', 'r*5')));
      assert.isFalse(graph.canAdd(variableGraph.createVertex('a', '')));

      var e = variableGraph.createVertex('e', '24332');
      e.name = '';
      assert.isFalse(graph.canAdd(e));

      var f = variableGraph.createVertex('f', '2');
      graph.add(f);
      assert.isFalse(graph.canAdd(variableGraph.createVertex('f', '@@#')));

    });

    it('check for duplicates', function() {
      var a = variableGraph.createVertex('a', '1');
      graph.add(a);

      var a2 = variableGraph.createVertex('a', '2');
      assert.isFalse(graph.canAdd(a2));

      var b = variableGraph.createVertex('b', '1');
      graph.add(b);

      var b2 = b.cloneEditing();
      assert.isTrue(graph.canAdd(b2));
    });

    it('can determine the children of an expression', function() {

      var a = variableGraph.createVertex('a', '1');
      var b = variableGraph.createVertex('b', '2');

      graph.add(a);
      graph.add(b);

      assert.deepEqual(graph.getExpressionChildren('1'), []);
      assert.deepEqual(graph.getExpressionChildren('a'), [a]);
      assert.deepEqual(graph.getExpressionChildren('a+b'), [a, b]);
      assert.deepEqual(graph.getExpressionChildren(2), []);

    });

  });

});
