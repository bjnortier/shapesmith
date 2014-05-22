define(['layers/layertree'], function(LayerTree) {

  describe('LayerTree', function() {

    it('can be empty', function() {

      var tree = new LayerTree();
      assert.deepEqual([], tree.toObj());

    });

    it('has containers', function() {

      var tree = new LayerTree();
      tree.createContainer('building');
      tree.createContainer('storey');

      assert.deepEqual([
        {type: 'building', name: 'building1', children: []},
        {type: 'storey', name: 'storey1', children: []},
      ], tree.toObj());

    });

    it('has nested containers', function() {

      var tree = new LayerTree();
      var building1 = tree.createContainer('building');
      tree.createContainer('building');
      var storey = tree.createContainer('storey');

      tree.moveInto(storey, building1);
      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: [
            {
              type: 'storey',
              name: 'storey1',
              children: [],
            }
          ]
        },
        {
          type: 'building',
          name: 'building2',
          children: [],
        }
      ], tree.toObj());

    });

    it('has containers that can be found by id', function() {

      var tree = new LayerTree();
      var building1 = tree.createContainer('building');
      tree.createContainer('building');
      var storey = tree.createContainer('storey');

      tree.moveInto(storey, building1);

      assert.isUndefined(tree.findContainerById('foo'));
      assert.equal(tree.findContainerById('building1').id, 'building1');
      assert.equal(tree.findContainerById('building2').id, 'building2');
    });

    it('creates a unique name for containers', function() {

      var tree = new LayerTree();
      tree.createContainer('building');
      tree.createContainer('building');

      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: [],
        },
        {
          type: 'building',
          name: 'building2',
          children: [],
        }
      ], tree.toObj());

    });

    it('has leafs', function() {
      var tree = new LayerTree();
      tree.createGeometryNode('point0');

      assert.deepEqual([
        {
          type: 'geometry',
          id: 'point0',
        },
      ], tree.toObj());

      assert.isObject(tree.findGeomNodeForId('point0'));
    });

    it('supports movebefore and moveafter', function() {

      var tree = new LayerTree();
      var building = tree.createContainer('building');
      var storey1 = tree.createContainer('storey');
      var storey2 = tree.createContainer('storey');

      tree.moveInto(storey1, building);
      tree.moveFirstBeforeSecond(storey2, storey1);

      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: [
            {
              type: 'storey',
              name: 'storey2',
              children: [],
            },
            {
              type: 'storey',
              name: 'storey1',
              children: [],
            }
          ]
        },
      ], tree.toObj());

      tree.moveFirstAfterSecond(storey2, storey1);

      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: [
            {
              type: 'storey',
              name: 'storey1',
              children: [],
            },
            {
              type: 'storey',
              name: 'storey2',
              children: [],
            }
          ]
        },
      ], tree.toObj());

    });

    it('supports moving containers with childen', function() {

      var tree = new LayerTree();
      var building = tree.createContainer('building');
      var storey = tree.createContainer('storey');
      var leaf = tree.createGeometryNode('point0');

      tree.moveInto(leaf, storey);
      tree.moveInto(storey, building);

      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: [
            {
              type: 'storey',
              name: 'storey1',
              children: [{
                type: 'geometry',
                id: 'point0',
              }],
            }
          ]
        },
      ], tree.toObj());

    });

    it('can be deserialized', function() {

      var tree = new LayerTree();
      var building = tree.createContainer('building');
      var storey = tree.createContainer('storey');
      var leaf = tree.createGeometryNode('point0');
      tree.moveInto(storey, building);
      tree.moveInto(leaf, storey);

      var obj = tree.toObj();

      tree.clear();
      assert.deepEqual([], tree.toObj());

      tree.fromObj(obj);

      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: [
            {
              type: 'storey',
              name: 'storey1',
              children: [{
                type: 'geometry',
                id: 'point0',
              }],
            }
          ]
        },
      ], tree.toObj());

      // After a desrialization, new containers may not use the same ids
      building = tree.createContainer('building');
      assert.equal(building.id, 'building2');

    });

    it('supports removal of leafs', function() {

      var tree = new LayerTree();
      var building = tree.createContainer('building');
      var leaf = tree.createGeometryNode('point0');
      tree.moveInto(leaf, building);

      assert.isTrue(tree.removeNode(leaf));
      assert.deepEqual([
        {
          type: 'building',
          name: 'building1',
          children: []
        }
      ], tree.toObj());

    });

    it('supports removal of containers', function() {

      var tree = new LayerTree();
      var building = tree.createContainer('building');
      var leaf = tree.createGeometryNode('point0');
      tree.moveInto(leaf, building);

      assert.isTrue(tree.removeNode(building));
      assert.deepEqual([
        {
          type: 'geometry',
          id: 'point0',
        }
      ], tree.toObj());

    });


    it('prevents removal of containers with container children', function() {

      var tree = new LayerTree();
      var building = tree.createContainer('building');
      var storey = tree.createContainer('storey');
      var leaf = tree.createGeometryNode('point0');
      tree.moveInto(storey, building);
      tree.moveInto(leaf, storey);

      assert.isFalse(tree.removeNode(building));
    });


  });

});
