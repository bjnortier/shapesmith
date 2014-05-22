define(['casgraph/sha1hasher'], function(sha1hasher) {

  describe('SHA1 Hasher', function() {

    var hash = sha1hasher.hash;
    var normalize = sha1hasher.normalize;

    it('can create normalized objects', function() {
      assert.equal(JSON.stringify(normalize(1)), '1');
      assert.equal(JSON.stringify(normalize([4,6,-1.2])), '[4,6,-1.2]');
      assert.equal(JSON.stringify(normalize({a:1, c:3, b:2})), '{"a":1,"b":2,"c":3}');
      assert.equal(JSON.stringify(normalize({a:{x:1}, c:[6], b:2})), '{"a":{"x":1},"b":2,"c":[6]}');

    });

    it('can hash objects', function() {
      var sha = hash({});
      assert.equal(sha, 'bf21a9e8fbc5a3846fb05b4fa0859e0917b2202f');
    });

    it('generates the same hash for equivalent objects', function() {
      var a1 = {a: 1, b:2, c:3};
      var a2 = {a: 1, c:3, b:2};

      var sha1 = hash(a1);
      var sha2 = hash(a2);
      assert.equal(sha1, sha2);

      assert.equal(hash({vertices: {}, edges: {}}), '25b0c891023305ca0d7fd094ffad5196708a8f9c');
      assert.equal(hash({edges: {}, vertices: {}}), '25b0c891023305ca0d7fd094ffad5196708a8f9c');
    });

  });

});
