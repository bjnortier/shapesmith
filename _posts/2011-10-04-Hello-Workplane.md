---
layout: postdeprecated
title: Hello Workplane
summary: I have been working on some big changes to Shapesmith that makes it vastly more usable to create and edit models - the introduction of a workplane. The workplane will be the basis for mouse interaction when creating primitives, doing transformations etc. The workplane is centered at (0,0,0) at the moment, with no ability to move it around, but that's coming.
---

I have been working on some big changes to Shapesmith that makes it vastly more usable to create and edit models - the introduction of a workplane. The workplane will be the basis for mouse interaction when creating primitives, doing transformations etc. The workplane is centered at (0,0,0) at the moment, with no ability to move it around, but that's coming.

Here are some examples of how you can create models with the new workplane:

<iframe src="http://player.vimeo.com/video/29986821" width="460" height="280" frameborder="0" webkitAllowFullScreen allowFullScreen></iframe>

Rotation
-------

To rotate the workplane around, a user can drag the view with the left mouse button. Scrolling is done with the mouse wheel (I just realised that I should also support scrolling for trackpads).

Point-and-click creation primitives 
----------------------------

For the first release, I have included creating and editing of primtives with the mouse and the workplane - this enables a user to create spheres, cuboids etc. with the mouse only. A user can right-click or left-click-and-hold on the workplane to create an object, where the origin will be placed where the user clicked:

![Primitive toolbar](/img/create-primitive.png)

When the primitive is being created, a user can click on the workplane to specify dimensions, and a preview of the primitive will be shown. When clicking on the workplane, the parameters can be entered in turn, where the focus will *proceed to the next empty parameter* every time a user clicks on the workplane:

![Primitivepreview](/img/primitive-preview.png)

When satisfied, clicking on the &ldquo;Ok&rdquo; button will create the primitive, and clicking &ldquo;Cancel&rdquo; or pressing  &ldquo;Esc&rdquo; on the keyboard will cancel the operation.

Selection-sensitive toolbar
---------------------

Once an object has been created, a user can access operations like delete, export to STL, and transformations by first selecting (left click), then accessing the context toolbar with a right-click (or left-click-and-hold):

![Edit toolbar](/img/edit-toolbar.png)

For boolean operations, 2 objects should be selected, then again right-click or left-click-and-hold to show the menu for multiple objects:

![Boolean toolbar](/img/boolean.png)

In Summary
---------

1. Left-click dragging will rotate the view. The mouse wheel will zoom in and out.
2. Left-clicking selects an object. Shift + left-clicking selects multiple objects.
3. The toolbar is selection-sensitive, so depending on whether 0, 1 or 2 objects are selected it will offer different options. 
4. Right-clicking or left-click-and-hold pops up the toolbar for primitive creating, transforms, booleans etc.

Head on over to <a href="/">http://shapesmith.net</a> and click the &ldquo;Try it&rdquo; button to gives these features a whirl.

If you find any bugs, please submit them to <a href="https://github.com/bjnortier/shapesmith/issues">https://github.com/bjnortier/shapesmith/issues</a>

Follow <a href="http://www.twitter.com/shapesmith">@shapesmith</a> for updates.

Build something!
