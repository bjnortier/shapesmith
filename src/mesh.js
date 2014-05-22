define([
    'underscore',
  ], function(_) {

    var doubleAndCopyArrayBuffer = function(buf) {
      var bufView1 = new Uint8Array(buf);
      var buf2 = new ArrayBuffer(buf.byteLength*2);
      var buf2View = new Uint8Array(buf2);
      for (var i = 0; i < buf.byteLength; ++i) {
        buf2View[i] = bufView1[i];
      }
      return buf2;
    };

    var Mesh = function(reservedTriangleSize, reservedLineSize) {
      // Init for 1000 points by default
      var initialNumTriangles = reservedTriangleSize || 1000;
      var initialNumLines = reservedLineSize || 1000;
      this.positions = new Float32Array(new ArrayBuffer(initialNumTriangles*36 + initialNumLines*24));
      this.triangleIndices = new Uint32Array(new ArrayBuffer(initialNumTriangles*12));
      this.lineIndices = new Uint32Array(new ArrayBuffer(initialNumTriangles*8));
      this.numPositions = 0;
      this.numTriangles = 0;
      this.numLines = 0;
    };

    Mesh.prototype.ensureSpaceAvailable = function() {
      if ((this.numPositions + 1)*12 > this.positions.buffer.byteLength) {
        this.positions = new Float32Array(doubleAndCopyArrayBuffer(this.positions.buffer));
      }
      if ((this.numTriangles + 1)*12 > this.triangleIndices.buffer.byteLength) {
        this.triangleIndices = new Uint32Array(doubleAndCopyArrayBuffer(this.triangleIndices.buffer));
      }
      if ((this.numLines + 1)*8 > this.lineIndices.buffer.byteLength) {
        this.lineIndices = new Uint32Array(doubleAndCopyArrayBuffer(this.lineIndices.buffer));
      }
    };

    Mesh.prototype.addTriangle = function(pointsOrIndices) {
      this.ensureSpaceAvailable();
      if (_.isArray(pointsOrIndices[0])) {
        this.triangleIndices[this.numTriangles*3]   = this.addPosition(pointsOrIndices[0]);
        this.triangleIndices[this.numTriangles*3+1] = this.addPosition(pointsOrIndices[1]);
        this.triangleIndices[this.numTriangles*3+2] = this.addPosition(pointsOrIndices[2]);
      } else {
        this.triangleIndices[this.numTriangles*3  ] = pointsOrIndices[0];
        this.triangleIndices[this.numTriangles*3+1] = pointsOrIndices[1];
        this.triangleIndices[this.numTriangles*3+2] = pointsOrIndices[2];
      }
      return this.numTriangles++;
    };

    Mesh.prototype.addLine = function(pointsOrIndices) {
      this.ensureSpaceAvailable();
      if (_.isArray(pointsOrIndices[0])) {
        this.lineIndices[this.numLines*2]   = this.addPosition(pointsOrIndices[0]);
        this.lineIndices[this.numLines*2+1] = this.addPosition(pointsOrIndices[1]);
      } else {
        this.lineIndices[this.numLines*2  ] = pointsOrIndices[0];
        this.lineIndices[this.numLines*2+1] = pointsOrIndices[1];
      }
      return this.numLines++;
    };

    Mesh.prototype.addPosition = function(point) {
      this.ensureSpaceAvailable();
      this.positions[this.numPositions*3  ] = point[0];
      this.positions[this.numPositions*3 + 1] = point[1];
      this.positions[this.numPositions*3 + 2] = point[2];
      return this.numPositions++;
    };

    Mesh.prototype.mergeIn = function(other) {
      for (var i = 0; i < other.numPositions; ++i) {
        this.addPosition([other.positions[i*3], other.positions[i*3+1], other.positions[i*3+2]]);
      }
      var offset = this.numTriangles*3 + this.numLines*2;
      for (i = 0; i < other.numTriangles; ++i) {
        this.addTriangle([
          offset + other.triangleIndices[i*3],
          offset + other.triangleIndices[i*3+1],
          offset + other.triangleIndices[i*3+2]
        ]);
      }
      for (i = 0; i < other.numLines; ++i) {
        this.addLine([
          offset + other.lineIndices[i*2],
          offset + other.lineIndices[i*2+1]
        ]);
      }
    };

    Mesh.prototype.toOBJ = function(name) {
      var header = '# OBJ ' + (name || '');
      var vertices = [];
      var i;
      for (i = 0; i < this.numPositions; ++i) {
        vertices.push(
          ['v', this.positions[i*3], this.positions[i*3+1], this.positions[i*3+2]]
          .join(' '));
      }
      var faces = [];
      for (i = 0; i < this.numTriangles; ++i) {
        faces.push(
          ['f', this.triangleIndices[i*3] + 1, this.triangleIndices[i*3+1] + 1, this.triangleIndices[i*3+2] + 1]
          .join(' '));
      }
      return [header].concat(vertices).concat(faces).join('\n');
    };

    return Mesh;

  });
