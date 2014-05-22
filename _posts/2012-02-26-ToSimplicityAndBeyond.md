---
layout: postdeprecated
title: To simplicity... and beyond!
title_image: /img/tosimplicity/buzz.png
summary: When I started Shapesmith, my vision was to create a simple, yet powerful 3D modelling application. Up to a few weeks ago my main focus was on creating a strong technical foundation that I could build on, and I'm quite pleased with the current architecture. Usability had been important, but not the top priority. This has changed.
---

&ldquo;Make everything as simple as possible, but not simpler.&rdquo;  
<span style="padding-left: 20px;">- Albert Einstein</span>

When I started Shapesmith, my vision was to create a simple, yet powerful 3D modelling application. Up to a few weeks ago my main focus was on creating a strong technical foundation that I could build on, and I'm quite pleased with the current architecture. Usability had been important, but not the top priority. This has changed.

My first attempt at simplifying geometry creation was illuminating, but unsatisfactory. The idea was to create a re-usable 3D cursor to move around 3D space to create radii, widths, move the origin etc. This turned out to be a step in the right direction, but too complicated for my liking.

It also became obvious that making it simple to design models requires the ability to move, rotate and resize objects with only a few mouse clicks and drags. This is something that other graphics and 3D modelling applications have as standard. And as Mr Potato Head would say:

<table style="padding-left: 20px"><tr><td><img src="/img/tosimplicity/mrpotatohead.png"/>
</td><td style="padding: 20px;">
&ldquo;Hey, a laser! How come <span style="font-style: italic">you</span> don't have a laser, Woody?&rdquo;
</td></tr></table>

Well, I've been working on the laser...

Moving, Resizing, Rotating
--------------------------

![Moving, Resizing, Rotating](/img/tosimplicity/translatescalerotate.png)

Shapesmith now has simple translatation, rotation and scale operations. The interaction is based on [Inkscape](http://inkscape.org/), my favourite vector drawing application. When an object is selected, you can see the draggable arrows that you can use to scale, and the draggable box at the center to translate the object:

<div class="center"><img src="/img/tosimplicity/translate.png" alt="Translate"/></div>

The scale arrows are used to scale:

<div class="center"><img src="/img/tosimplicity/scale.png" alt="Scale"/></div>

When you click on a selected object <span style="font-style: italic">again</span>, the scale arrows are replaced with rotation arrows for the three major axes:

<div class="center"><img src="/img/tosimplicity/rotate.png" alt="Rotate"/></div>

Mouse-only Geometry
-----------------

Using the lessons learnt from the new transformations (including better abstraction in the code using parts of [backbone.js](http://documentcloud.github.com/backbone/)), I re-worked all the geometry creation as well with the aim of making it possible to create geometry only using the mouse. The concept of a re-usable 3D cursor has been abandoned in favour of geometry-specific interactions:

<div class="center"><img src="/img/tosimplicity/geometrycreation.png" alt="Geometry creation"/></div>

The Tree View is still fully functional, and can be used to edit nodes that are not top-level nodes, existing transforms etc. by double-clicking on the values. The Tree View is hidden by default but still available to advanced users:


<div class="center"><img src="/img/tosimplicity/advancedtreeview.png" alt="Hidden tree View"/></div>

What's next?
----------

In terms of usability, the next area I'm going to focus on is a dynamic workplane. At the moment, the workplane is static at the origin, and oriented in the Z=0 plane. A dynamic workplane implies being able to position it at specific coordinates, but also snapping it to flat surfaces. I would also like to experiment with other types of grids.

But more importantly, what improvements and features would <span style="font-style: italic">YOU</span> like to see next in Shapesmith?

Happy making.







