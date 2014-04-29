/**
 * Adapted from https://github.com/mrdoob/three.js/blob/master/examples/js/loaders/STLLoader.js
 */

define(['csg'], function(CSG) {

  function ensureBinary(buf) {

    if (typeof buf === "string") {
      var array_buffer = new Uint8Array(buf.length);
      for(var i = 0; i < buf.length; i++) {
        array_buffer[i] = buf.charCodeAt(i) & 0xff; // implicitly assumes little-endian
      }
      return array_buffer.buffer || array_buffer;
    } else {
      return buf;
    }

  }

  function ensureString(buf) {

    if (typeof buf !== "string") {
      var array_buffer = new Uint8Array(buf);
      var str = '';
      for(var i = 0; i < buf.byteLength; i++) {
        str += String.fromCharCode(array_buffer[i]); // implicitly assumes little-endian
      }
      return str;
    } else {
      return buf;
    }
  }

  function isBinary(binData) {
    var expect, face_size, n_faces, reader;
    reader = new DataView(binData);
    face_size = (32 / 8 * 3) + ((32 / 8 * 3) * 3) + (16 / 8);
    n_faces = reader.getUint32(80,true);
    expect = 80 + (32 / 8) + (n_faces * face_size);
    return expect === reader.byteLength;
  }

  function parseBinary(data) {

    var reader = new DataView(data);
    var n_faces = reader.getUint32(80, true);
    var dataOffset = 84;
    var faceLength = 12 * 4 + 2;
    var normal, start;
    var faces = [];

    for (var face = 0; face < n_faces; face++) {

      start = dataOffset + face * faceLength;
      normal = new CSG.Vector(
        reader.getFloat32(start,true),
        reader.getFloat32(start + 4,true),
        reader.getFloat32(start + 8,true)
      );

      var vertices = [];
      for (var i = 1; i <= 3; ++i) {
        var vertexstart = start + i * 12;
        vertices.push(
          new CSG.Vertex(
            new CSG.Vector(
              reader.getFloat32(vertexstart,true),
              reader.getFloat32(vertexstart + 4,true),
              reader.getFloat32(vertexstart + 8,true)),
            normal));
      }

      faces.push(new CSG.Polygon(vertices));
    }

    return faces;
  }

  function parseASCII(data) {

    var result, text, normal, vertices;
    var faces = [];

    var patternFace = /facet([\s\S]*?)endfacet/g;
    while ((result = patternFace.exec(data)) !== null) {

      text = result[0];

      // Dont move outside the while loop - the regex must be new for each normal
      var patternNormal = /normal[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
      while ((result = patternNormal.exec(text)) !== null) {
        normal = new CSG.Vector(
          parseFloat(result[1]),
          parseFloat(result[3]),
          parseFloat(result[5]));
      }

      vertices = [];
      // Dont move outside the while loop - the regex must be new for each set of vertices
      var patternVertex = /vertex[\s]+([\-+]?[0-9]+\.?[0-9]*([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+[\s]+([\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?)+/g;
      while ((result = patternVertex.exec(text)) !== null) {
        vertices.push(new CSG.Vertex(
          new CSG.Vector(
            parseFloat(result[1]),
            parseFloat(result[3]),
            parseFloat(result[5])),
          normal));
      }

      faces.push(new CSG.Polygon(vertices));

    }

    return faces;
  }


  // Parse either binary or ASCII data
  function parse(data) {
    var binData = ensureBinary(data);
    var faces =  isBinary(binData) ?
      parseBinary(binData) : parseASCII(ensureString(data));
    return faces;

  }

  return parse;

});

