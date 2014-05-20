define(['underscore', 'casgraph/graph'], function(_, CASGraph) {

  describe('CAS Graph', function() {

    var cas;
    var simpleHashFn = function(obj) {
      return '_' + obj.id;
    };

    beforeEach(function() {
      cas = new CASGraph();
    });

    it('can store, fetch, replace and remove objects', function() {
      cas = new CASGraph({idKey: '_id'});

      // Store
      assert.throws(function() {
        cas.put({});
      }, Error, "object has no '_id' property");

      // Fetch
      var a = {_id: 'a'};
      cas.put(a);
      assert.deepEqual(cas.get('a'), a);

      // Replace
      assert.throws(function() {
        cas.replace({_id: 'b'});
      }, Error, "no object 'b' in graph");
      var a2 = {_id: 'a', newprop: 'foo'};
      cas.replace(a2);
      assert.deepEqual(cas.get('a'), a2);

      // Remove
      assert.throws(function() {
        cas.remove({_id: 'b'});
      }, Error, "no object 'b' in graph");
      cas.remove(a);

      assert.isUndefined(cas.get('a'));

    });

    it('will reject inserting an object already in the graph', function() {
      var a = {id: 'a'};
      cas.put(a);

      assert.throws(function() {
        cas.put(a);
      }, Error, "object with id 'a' already in graph");
    });

    it('has edges', function() {
      var a = {id: 'a'}, b = {id: 'b'}, c = {id: 'c'};
      cas.put(a);
      cas.put(b);
      cas.put(c);

      assert.throws(function() {
        cas.createEdge(a, {});
      }, Error, "no object 'undefined' in graph");
      assert.throws(function() {
        cas.createEdge({}, a);
      }, Error, "no object 'undefined' in graph");

      cas.createEdge(a,b);
      cas.createEdge(c,b);
      assert.deepEqual(cas.getOutgoing(a), [b]);
      assert.deepEqual(cas.getOutgoing(b), []);
      assert.deepEqual(cas.getOutgoing(c), [b]);
      assert.deepEqual(cas.getIncoming(a), []);
      assert.deepEqual(cas.getIncoming(b), [a, c]);
      assert.deepEqual(cas.getIncoming(c), []);

      cas.remove(a);
      assert.isUndefined(cas.get(a));
      assert.deepEqual(cas.getOutgoing(b), []);
      assert.deepEqual(cas.getOutgoing(c), [b]);
      assert.deepEqual(cas.getIncoming(b), [c]);
      assert.deepEqual(cas.getIncoming(c), []);

      cas.removeEdge(c,b);
      assert.deepEqual(cas.getOutgoing(b), []);
      assert.deepEqual(cas.getOutgoing(c), []);
      assert.deepEqual(cas.getIncoming(b), []);
      assert.deepEqual(cas.getIncoming(c), []);

    });

    it('can be serialized', function() {
      var cas = new CASGraph({
        serializableFn: function(obj) {
          return obj.val !== 'dont_serialize';
        },
      });
      var a = {id: 'a', val: 'a'};
      var b1 = {id: 'b', val: 'b1'};
      var b2 = {id: 'b', val: 'b2'};
      var c1 = {id: 'c', val: 'c'};
      var c2 = {id: 'c', val: 'dont_serialize'};
      cas.put(a);
      cas.put(b1);
      cas.createEdge(a,b1);
      cas.replace(b2);
      cas.put(c1);
      cas.replace(c2);
      cas.setMetadata('meta');

      var serialized = cas.serialize();
      assert.deepEqual(serialized, {
        vertices: {
          a: a,
          b: b2,
        },
        edges: {
          a: ['b'],
        },
        metadata: 'meta'
      });
    });

    it('can be hash-serialized', function() {
      var cas = new CASGraph({
        hashFn: function(obj) {
          return '_' + obj.val;
        },
        serializableFn: function(obj) {
          return obj.val !== 'dont_serialize';
        },
      });
      var a = {id: 'a', val: 'a'};
      var b1 = {id: 'b', val: 'b1'};
      var b2 = {id: 'b', val: 'b2'};
      var c1 = {id: 'c', val: 'c'};
      var c2 = {id: 'c', val: 'dont_serialize'};
      cas.put(a);
      cas.put(b1);
      cas.createEdge(a,b1);
      cas.replace(b2);
      cas.put(c1);
      cas.replace(c2);
      cas.setMetadata({foo:'bar'});

      var hashSerialized = cas.hashSerialize();
      assert.deepEqual(hashSerialized, {
        vertices: ['_a', '_b2'],
        edges: {
          _a: ['_b2'],
        },
        metadata: {foo: 'bar'}
      });
    });

    it('can be restored from a hash-serialization', function() {

      var hashedGraph = {
        vertices: ['_a', '_b'],
        edges: {'_a': ['_b']},
        metadata: {foo: 'bar'}
      };
      var hashesToVertices = {
        '_a' : {id: 'a'},
        '_b' : {id: 'b'}
      };

      cas.fromHashSerialization(hashedGraph, hashesToVertices);

      assert.deepEqual(cas.serialize(), {
        vertices: {
          a: {id: 'a'},
          b: {id: 'b'}
        },
        edges: {
          a: ['b'],
        },
        metadata: {foo: 'bar'}
      });

    });

    it('generates vertex hashing events', function() {
      var cas = new CASGraph({hashFn: simpleHashFn});
      var events = [];

      cas.on('vertexHashed', function(hash, vertex) {
        var event = {};
        event[hash] = vertex;
        events.push(event);
      });

      var a = {id: 'a'}, b = {id: 'b'};
      cas.put(a);
      cas.put(b);
      cas.createEdge(a,b);
      cas.remove(a);

      assert.deepEqual(events, [
        { _a: a },
        { _b: b },
      ]);

    });

    it('can be cloned', function() {
      var a = {id: 'a'}, b = {id: 'b'}, c = {id: 'c'};
      var cas1 = new CASGraph();
      cas1.put(a);
      cas1.put(b);
      cas1.createEdge(a,b);

      var cas2 = cas1.clone();
      cas1.put(c);
      cas1.createEdge(a,c);

      assert.deepEqual(cas1.serialize(), {
        vertices: {
          a: {id: 'a'},
          b: {id: 'b'},
          c: {id: 'c'},
        },
        edges: {
          a: ['b', 'c'],
        }
      });

      assert.deepEqual(cas2.serialize(), {
        vertices: {
          a: {id: 'a'},
          b: {id: 'b'},
        },
        edges: {
          a: ['b'],
        }
      });

    });

    var EventLog = function() {
      var that = this;
      this.events = [];
      this.listener = function(event) {
        that.events.push(event);
      };
    };

    it('can generate add/remove diff events', function() {
      var cas1 = new CASGraph(), cas2 = new CASGraph();
      var a = {id: 'a'}, b = {id: 'b'};
      cas1.put(a);
      cas2.put(b);

      var logger12 = new EventLog();
      var logger21 = new EventLog();
      cas2.diffFrom(cas1, logger12.listener);
      cas1.diffFrom(cas2, logger21.listener);
      assert.deepEqual(logger12.events, [
        {vertexRemoved: a},
        {vertexAdded: b},
      ]);
      assert.deepEqual(logger21.events, [
        {vertexRemoved: b},
        {vertexAdded: a}
      ]);
    });

    it('can generate replacement diff events', function() {
      var cas1 = new CASGraph(), cas2 = new CASGraph();
      var a1 = {id: 'a', val: 'a1'};
      var a2 = {id: 'a', val: 'a2'};
      cas1.put(a1);
      cas2 = cas1.clone();
      cas2.replace(a2);

      var logger12 = new EventLog();
      var logger21 = new EventLog();
      cas2.diffFrom(cas1, logger12.listener);
      cas1.diffFrom(cas2, logger21.listener);

      assert.deepEqual(logger12.events, [
        {vertexReplaced: {from: a1, to: a2}}
      ]);
      assert.deepEqual(logger21.events, [
        {vertexReplaced: {from: a2, to: a1}}
      ]);
    });

    it('can generate metadata diff events', function() {
      var cas1 = new CASGraph(), cas2 = new CASGraph();
      cas1.setMetadata('a');
      cas2.setMetadata('b');

      var logger12 = new EventLog();
      var logger21 = new EventLog();
      cas2.diffFrom(cas1, logger12.listener);
      cas1.diffFrom(cas2, logger21.listener);
      assert.deepEqual(logger12.events, [
        {metadataChanged: {from: 'a', to: 'b'}},
      ]);
      assert.deepEqual(logger21.events, [
        {metadataChanged: {from: 'b', to: 'a'}},
      ]);
    });

    it('can search for vertices by property', function() {

      var a = {id: 'a', name: 'theA'};
      cas.put(a);
      assert.deepEqual(cas.getByProperty('name', 'theA'), a);

    });

    it('has leaf-first search', function() {

      var a = {id: 'a'}, b = {id: 'b'}, c = {id: 'c'};
      var x = {id: 'x'}, y = {id: 'y'}, z = {id:'z'};
      cas.put(a);
      cas.put(b);
      cas.put(c);
      cas.put(x);
      cas.put(y);
      cas.put(z);
      cas.createEdge(a,b);
      cas.createEdge(b,c);
      cas.createEdge(x,y);

      var sequence = [];
      cas.leafFirstSearch(function(vertex) {
        sequence.push(vertex.id);
      });
      assert.deepEqual(sequence, ['c', 'b', 'a', 'y', 'x', 'z' ]);

      cas.createEdge(c,x);

      sequence = [];
      cas.leafFirstSearch(function(vertex) {
        sequence.push(vertex.id);
      });
      assert.deepEqual(sequence, ['y', 'x', 'c', 'b', 'a', 'z' ]);

      cas.removeEdge(b,c);

      sequence = [];
      cas.leafFirstSearch(function(vertex) {
        sequence.push(vertex.id);
      });
      assert.deepEqual(sequence, ['b', 'a', 'y', 'x', 'c', 'z' ]);


    });

    it('can use a strip function for hashing and serialization', function() {

      var cas = new CASGraph({
        hashFn: function(obj) {
          return '_' + obj.id;
        },
        stripFn: function(obj) {
          var strippedObj = {};
          for (var key in obj) {
            if (obj.hasOwnProperty(key) && (key[0] !== '_')) {
              strippedObj[key] = obj[key];
            }
          }
          return strippedObj;
        }
      });
      var a = {id: 'a', _x: '2'};
      var b = {id: 'b', value: 'bb'};
      cas.put(a);
      cas.put(b);
      cas.createEdge(a,b);

      var serialized = cas.serialize();

      assert.deepEqual(serialized, {
        vertices: {
          a: {id: 'a'},
          b: b,
        },
        edges: {
          a: ['b'],
        },
      });

    });

    it('has a hash of it\'s own', function() {
      var hashFn = function(obj) {
        if (obj.id) {
          return '_' + obj.id;
        } else {
          return _.keys(obj.vertices).length + '_' + _.keys(obj.edges).length;
        }

      };
      var cas = new CASGraph({
        hashFn: hashFn
      });

      var a = {id: 'a'}, b = {id: 'b'};
      cas.put(a);
      cas.put(b);

      cas.serialize();
      assert.deepEqual(cas.getHash(), '2_0');

    });

  });

});
