define(['mesh'], function(Mesh) {

  describe('Mesh', function() {

    var triangleToArray = function(mesh, triangleNumber) {
      var result = [];
      for (var i = 0; i < 3; ++i) {
        var positionIndex = mesh.triangleIndices[triangleNumber*3+i];
        for (var j = 0; j < 3; ++j) {
          result.push(mesh.positions[positionIndex*3+j]);
        }
      }
      return result;
    };

    var lineToArray = function(mesh, lineNumber) {
      var result = [];
      for (var i = 0; i < 2; ++i) {
        var positionIndex = mesh.lineIndices[lineNumber*2+i];
        for (var j = 0; j < 3; ++j) {
          result.push(mesh.positions[positionIndex*3+j]);
        }
      }
      return result;
    };

    it('can create am empty mesh', function() {
      var mesh = new Mesh();
      assert.equal(0, mesh.numPositions);
      assert.equal(0, mesh.numTriangles);
    });

    it('can add points to meshes', function() {
      var mesh = new Mesh();

      var index = mesh.addPosition([0,0,0]);
      assert.equal(0, index);
      assert.equal(1, mesh.numPositions);
      assert.equal(0, mesh.numTriangles);

    });

    it('supports lines', function() {
      var mesh = new Mesh();
      var line0 = mesh.addLine([[0,0,0],[10,10,10]]);

      assert.equal(0, line0);
      assert.equal(2, mesh.numPositions);
      assert.equal(0, mesh.numTriangles);
      assert.equal(1, mesh.numLines);
      assert.deepEqual(lineToArray(mesh, 0), [0,0,0,10,10,10]);
    });

    it('can create meshes that automatically resize', function() {
      var mesh = new Mesh(1, 1);

      mesh.addTriangle([[0,0,0],[10,10,10],[0,0,10]]);
      assert.equal(mesh.numPositions, 3);
      assert.equal(mesh.numTriangles, 1);
      assert.equal(mesh.numLines, 0);
      assert.deepEqual(triangleToArray(mesh, 0), [0,0,0,10,10,10,0,0,10]);

      mesh.addLine([[0,0,0],[10,10,10]]);
      assert.equal(mesh.numPositions, 5);
      assert.equal(mesh.numTriangles, 1);
      assert.equal(mesh.numLines, 1);
      assert.deepEqual(lineToArray(mesh, 0), [0,0,0,10,10,10]);

      mesh.addTriangle([[0,0,0],[10,10,10],[0,0,10]]);
      assert.equal(mesh.numPositions, 8);
      assert.equal(mesh.numTriangles, 2);
      assert.deepEqual(triangleToArray(mesh, 0), [0,0,0,10,10,10,0,0,10]);
      assert.deepEqual(triangleToArray(mesh, 1), [0,0,0,10,10,10,0,0,10]);

      mesh.addLine([[5,2,3],[1,4,7]]);
      assert.equal(mesh.numPositions, 10);
      assert.equal(mesh.numTriangles, 2);
      assert.equal(mesh.numLines, 2);
      assert.deepEqual(lineToArray(mesh, 1), [5,2,3,1,4,7]);

    });

    it('can export an empty mesh to OBJ', function() {
      var mesh = new Mesh();
      var obj = mesh.toOBJ('empty');

      mesh.addTriangle([[0,0,0],[10,10,10],[0,10,10]]);

      assert.equal('# OBJ empty', obj);

    });

    it('can export triangles to OBJ', function() {

      var mesh = new Mesh();
      mesh.addTriangle([[0,0,0],[10,10,10],[0,10,10]]);
      var v4 = mesh.addPosition([20,20,5]);
      mesh.addTriangle([0,1,v4]);
      var obj = mesh.toOBJ('Test');

      var expected = [
        '# OBJ Test',
        'v 0 0 0',
        'v 10 10 10',
        'v 0 10 10',
        'v 20 20 5',
        'f 1 2 3',
        'f 1 2 4'
      ].join('\n');
      assert.equal(expected, obj);

    });

    it('can merge in another mesh', function() {

      var mesh1 = new Mesh();
      mesh1.addTriangle([[0,0,0],[10,10,10],[0,0,10]]);
      mesh1.addLine([[1,2,3],[4,5,6]]);
      var mesh2 = new Mesh();
      mesh2.addTriangle([[50,0,0],[50,10,10],[5,0,10]]);
      mesh2.addLine([[7,8,9],[0,1,2]]);

      mesh1.mergeIn(mesh2);

      assert.equal(2, mesh1.numTriangles);
      assert.equal(2, mesh1.numLines);
      assert.equal(10, mesh1.numPositions);
      assert.deepEqual(triangleToArray(mesh1, 0), [0,0,0,10,10,10,0,0,10]);
      assert.deepEqual(triangleToArray(mesh1, 1), [50,0,0,50,10,10,5,0,10]);
      assert.deepEqual(lineToArray(mesh1, 0), [1,2,3,4,5,6]);
      assert.deepEqual(lineToArray(mesh1, 1), [7,8,9,0,1,2]);
    });

  });

});
