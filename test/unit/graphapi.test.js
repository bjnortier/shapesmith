define([
    'geomnode',
    'geometrygraph',
    'graphapi'
  ],
  function(GeomNode, GeometryGraph, API) {

    describe('Graph API', function() {

      it('can read a geometry graph', function() {

        var p1 = new GeomNode.Point({});
        var p2 = new GeomNode.Point({});
        var p3 = new GeomNode.Polyline({});

        var serializedGraph = {
          edges: {
            '939c03b': ['5db75d9', '2349391'],
          },
          vertices: ['5db75d9', '2349391', '939c03b']
        };
        var hashesToVertices = {
          '5db75d9' : GeomNode.strip(p1),
          '2349391' : GeomNode.strip(p2),
          '939c03b' : GeomNode.strip(p3),
        };

        var graph = API.loadGraph(serializedGraph, hashesToVertices);
        assert.isObject(graph);

        var p1b = graph.vertexById(p1.id);
        var p2b = graph.vertexById(p2.id);
        var p3b = graph.vertexById(p3.id);

        assert.isObject(p1b);
        assert.isObject(p2b);
        assert.isObject(p3b);

      });

      it('can create the OBJ file for an empty graph', function() {

        var serializedGraph = '{"vertices":[],"edges":{}}';
        var hashesToVertices = '{}';
        API.toOBJ(JSON.parse(serializedGraph), JSON.parse(hashesToVertices));

      });

      it('can hash an object', function() {
        var a1 = {
          id: 'point0',
          editing: true, // should be ignored
          parameters: {x: 1},
          extras11nFields: [],
        };
        var a2 = {
          id: 'point0',
          editing: true, // should be ignored
          parameters: {x: 1},
          extras11nFields: [],
        };

        var hash1 = API.hashObject(a1);
        var hash2 = API.hashObject(a2);

        assert.equal(hash1, hash2);

        var graph = {vertices: {}, edges: {}};
        assert.equal(API.hashObject(graph), '25b0c891023305ca0d7fd094ffad5196708a8f9c');
      });

    });

  });
