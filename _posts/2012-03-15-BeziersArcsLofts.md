---
layout: postdeprecated
title: 0.7 - Beziers, Polylines, Arcs, Revolves, Fillets, Lofts & Plane mirror
summary: It all started with an airfoil. I created Shapesmith because I wanted to design & 3D print a UAV, and the tools available were not what I wanted. Well, I'm happy to announce that I (and YOU*) can design bezier-based, parametric airfoils with Shapesmith 0.7
---

It all started with an airfoil. I created Shapesmith because I wanted to design & 3D print a UAV, and the tools available were not what I wanted. Well, I'm happy to announce that I (and *YOU*) can design bezier-based, parametric airfoils with Shapesmith 0.7:

![Wing](/img/wings/loft.png)

And also a few other cool new things. 

## 1D Shapes

The first category is wire geometries, or 1D geometries. These are Elliptical arcs, Polylines and Beziers:

![ArcBezierPolyline](/img/wings/arcbezierpolyline.png)

Elliptical arcs can be full ellipses or arcs on the ellipse. You can also create circles and circular arcs by makes both radii the same. Polylines and Bezier curves completes the new 1D geometries.

## Making faces from wires

In order to get to 3D printable objects, we need some operators to get from 1D to 2D shapes, or surfaces, and also a way to get from surfaces to solid objects.

If you want to create a surface from wires, there is the make_face operator:

![Make Face](/img/wings/make_face.png)

When you select on or more wires like arcs, polylines and beziers, and they form the boundary of a potential *flat* surface, you can make a surface (or face) from these wires. This is now a 2D shape that can be used with other operators to create a 3D shape.

## Revolve and Make Solid

Next up is the revolve and make solid operator:

![Revolve and make solid](/img/wings/make_solid.png)

The revolve operator is similar to the prism operator which was introduced in 0.6, but a cylindrical equivalent. You can revolve a wire (1D) or a surface (2D) shape around an axis. If you revolve a wire, it will produce a surface. If you revolve a surface, it will produce a solid.

In this example, a wire has been revolved to form a surface. It is unfortunately hard to know that it's not a solid shape, but if you subtract a solid shape from this result you will see the shape is not solid.

To make a solid from this shape (basically to fill it in), you can use the make_solid operator. Then boolean operations will give the expected results as you can see in the illustration, where a cuboid has been subtracted.

## Fillet

When you have a solid shape with sharp edges that you want to round off, you can use the Fillet operator:

![Fillet](/img/wings/fillet.png)

## Lofts!

I've left the best for last. When you have two (or more!) surfaces, you can use the loft opertor to create a shape that's the transition from the one to the other. You have to be careful, as some shapes will not be lofted successfully by the OpenCASCADE kernel, but you can make some really interesting shapes:

![Lofts](/img/wings/loft2.png)

And if you combine that with the other new transform, plane mirror, you can create some really interesting shapes like a wing structure:

![Mirrored Wings](/img/wings/mirrored_wings.png)

I'm really enjoying building models with these new functions, and I hope you will try them out for yourself. Shapesmith has some really great modelling features now, which have only been available on the desktop.

What other kinds of geometry would you like?

Make something!





