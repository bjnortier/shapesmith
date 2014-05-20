define(['underscore', 'casgraph/graph', 'casgraph/replicator'], function(_, CASGraph, Replicator) {

  describe('CAS Graph Replicator', function() {

    it('can write vertices', function() {

      var graph = new CASGraph({
        hashFn : function(obj) {
          return obj.hasOwnProperty('id') ?
            '_' + obj.id :
            '_' + _.keys(obj.vertices).length;
        }
      });

      var log = [];

      var write = function(hash, vertex, callback) {
        var event = {};
        event[hash] = vertex;
        log.push(event);
        callback(true);
      };

      var read = function() {
        throw new Error('read should not be called');
      };

      var readers = {vertex: read, graph: read};
      var writers = {vertex: write, graph: write};
      var replicator = new Replicator(readers, writers);
      replicator.attachTo(graph);

      graph.put({id: 'a'});
      graph.hashGraphAndNotify();

      assert.equal(log.length, 2);
      assert.deepEqual(log[0], {_a: {id:'a'}});
      assert.deepEqual(log[1], {_1: {vertices: ['_a'], edges: {}}});

    });

    it('can read a graph', function(done) {
      this.timeout(500);

      var a = {id: 'a'};
      var b = {id: 'b'};
      var hashedGraph = {
        vertices: ['_a', '_b'],
        edges: {'_a': ['_b']}
      };

      var write = function() {
        throw new Error('write should not be called');
      };

      var readGraph = function(hash, callback) {
        if (hash === '_graphhash') {
          callback(true, '_graphhash', hashedGraph);
        } else {
          throw new Error('unexpected graph hash');
        }
      };

      var readVertex = function(hash, callback) {
        if (hash === '_a') {
          callback(true, hash, a);
        } else if (hash === '_b') {
          callback(true, hash, b);
        } else {
          throw new Error('unexpected vertex hash');
        }
      };

      var graph = new CASGraph({
        hashFn : function(obj) {
          return obj.hasOwnProperty('id') ?
            '_' + obj.id :
            '_' + _.keys(obj.vertices).length;
        }
      });

      var readers = {vertex: readVertex, graph: readGraph};
      var writers = {vertex: write, graph: write};
      var replicator = new Replicator(readers, writers);

      replicator.attachTo(graph);
      replicator.readGraph('_graphhash', function(success) {
        assert.isTrue(success);

        replicator.detachFrom(graph);
        assert.deepEqual(graph.serialize(), {
          vertices: {
            'a': a,
            'b': b
          },
          edges: {
            'a': ['b']
          }
        });
        done();
      });

    });

  });

});
