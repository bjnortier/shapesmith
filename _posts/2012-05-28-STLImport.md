---
layout: postdeprecated
title: STL Import
summary: I'm happy to announce that the first version of STL import is now available in Shapesmith (0.9.1) and online at cloud.shapesmith.net. This means you can import STL files like the <a href="http://www.thingiverse.com/thing:23279">Apparently Impossible Cube</a> from Thingiverse.
---

I'm happy to announce that the first version of STL import is now available in Shapesmith (0.9.1) and online at cloud.shapesmith.net. This means you can import STL files like the ["Apparently Impossible Cube"](http://www.thingiverse.com/thing:23279) from Thingiverse:

![The Impossible Cube](/img/stlimport/impossible.png)

A [measuring spoon](http://www.thingiverse.com/thing:22627):

![Measuring Spoon](/img/stlimport/2tsp.png)

Or a [Castle](http://www.thingiverse.com/thing:22323):

![Castle](/img/stlimport/castle2.png)


On the surface, this sounds like a  simple feature, since OpenCASCADE has support for importing STL. 

BUT because of the underlying geometry kernel, large STL files are hard to import. For this reason STL imports will be *automatically simplified* (i.e. the triangle count will be reduced to a manageble level). For this I use a library called [GTS](http://gts.sourceforge.net/), and is an optional install if you have a local version of Shapesmith.

Why is this necessary?

Shapesmith is build on top of a solid modelling kernel known as [OpenCASCADE](http://www.opencascade.org/), which utilises a technique called [Boundary Representation](http://en.wikipedia.org/wiki/Boundary_representation).

What this essentially means is that the model is described in terms of mathematical equations describing the boundaries on (potentially curved) surfaces of the model, as opposed to representing the model as a collection of flat triangles (a 'discrete' representation).

A useful analogy is that a BRep model is to Mesh model as a Vector image is to a Bitmap image. There are some advantages and disadvantages to using BRep, compared to a mesh representation.

BRep is resolution independant. If you have an object with curves like a small sphere, and scale it up to 100x it's original size, it will still be an accurate sphere. But for mesh representations, the model will lose resolution - in the same way that bitmaps become pixelated when you zoom in, but vector images retain their exact shape. This is great for parametric models, since you can re-evauluate any object in the hierarchy and still have an accurate result.

On the downside though, boolean operations in BRep are computationally intensive and don't scale well with the complexity of the model. It's also hard to represent meshes well in a BRep-based modeller.

In the long term, it would be great to have a hybrid BRep/Mesh geometry kernel, which gives the user the ability to tune the tradeoffs.

For now though, STL imports will be simplified to a manageable level so that you can still edit them (e.g. put a hole for a ring in that measuring spoon).

Try it!

P.S. The serialisation format has changed, so if you have a local install, you need to clear out the BRep cache. Instructions can be found in UPGRADE.md

 

   













