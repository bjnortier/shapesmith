---
layout: postdeprecated
title: Introducing editable, parametric workplanes
summary: Workplanes, or local reference planes, are very useful things. Often when designing a 3D model, you work within a reference plane. For example, if you are building a car, you might create a reference plane at each wheel location, so modelling each wheel is easier. It allows you to focus on the local work area without distraction.
---

*This post is can also be found on the [Shapesmith Wiki](https://github.com/bjnortier/shapesmith/wiki/The-Workplane).*

Workplanes, or local reference planes, are very useful things. Often when designing a 3D model, you work within a reference plane. For example, if you are building a car, you might create a reference plane at each wheel location, so modelling each wheel is easier. It allows you to focus on the local work area without distraction.

To edit the workplane, click the checkbox in the top right-hand corner. Enabling it will show the current workplane parameters. To edit the workplane, click on any of the values (the mouse cursor will turn into a hand):

![Editing the workplane](/img/parametric-workplanes/editing-workplane.png)

When in editing mode, you can edit the workplane by:

 * using the visual elements to move and rotate the plane. I.e. drag the  origin box or drag the arrows to rotate it around the principle axes.
 * editing the parameters manually.
 * using the standard XY, YZ and ZX buttons.

When you create geometry objects, they are created on the current workplane. And *each geometry object has it's own workplane*. This is important for parametric editing (i.e. going back to an object to change it).

There are some simple rules to remember for workplanes and geometry objects:

 * Each object has its own workplane.
 * Each object gets a copy of the current workplane when the object is created.
 * Transforms (translating, scaling and rotating) are applied within the local workplane.

In the user interface, when an object is selected, the workplane of the object is shown. Thus, when translating, scaling or rotating the object, these operations are shown visually on the workplane of the current object:

![Transforms are on the workplane](/img/parametric-workplanes/transforms-are-on-the-workplane.png)
    
There is no visual editing of an existing workplane at the moment, but you can edit the parameters of an object's workplane as you would edit the other geometry parameters.

There are some further features and enhancements planned for workplanes:

 * The ability edit the workplane of existing geometry objects visually.
 * Setting the current workplane to that of a selected object, and vice versa.
 * Changing the minor and major ticks and snapping tolerance.



Follow Shapesmith on [Twitter](http://twitter.com/shapesmith).