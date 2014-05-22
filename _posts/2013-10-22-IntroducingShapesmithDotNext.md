---
layout: post
title: Introducing Shapesmith.next
summary: 
---

Finally.

*(If you're impatient, you can head over to [https://next.shapesmith.next](https://next.shapesmith.net/) and try out the new version, then come back here and read the post)*.

I'm proud to announce the future of Shapesmith, dubbed "Shapesmith.next". This is a reference to the next version of Javascript, ES.next, since Shapesmith is now a *pure Javascript* application. 

This application will become "Shapesmith", and the previous beast will be deprecated.

# Why?

I explained the reasons behind moving to a pure JS architecture [in a previous post](http://shapesmith.net/2013/03/06/ProgressUpdate.html). For more insight you can read that post. In summary these were:

 * OpenCASCADE didn't scale (is uses too much CPU for a cloud-based modelling application).
 * OpenCASCADE is too complicated and badly documented.
 * Using 3 languages (Javascript, Erlang, C++) in an application was too complex a very high hurdle to create pull requests.

# Does it work?

Yes, it works! In some ways the new application is better, but in other ways it has less functionality (for now).

At this moment, the geometry kernel is experimental and mesh-based, and not as capable as OpenCASCADE in terms of geometric capabilities. The geometry primitives available are limited to cube, spheres, cylinders etc., and boolean operations using these. 

However, since geometry computation is now under my control, I hope that the future development profile will look something like this:

![v1 vs .next](/img/introducingdotnext/v1vsdotnext.png)

For example, things that were impossible before, like STL importing and text engraving, will be possible. 

From an architectural perspective, having a single-language architecture with Javascript in the front-end and Node.js in the back, is great for several reasons:

 * Being able to offload the geometry computation to the client makes the service orders of magnitude more scalable. My aim is to create a platform that is very cheap to use, and creating an application where users would be able to create lots of free models would be impossible before.
 * A single language architecture allows you to use the same tools *everywhere*. For example, I can run unit tests using node, but also in the browser. That way unit tests are automated, but I can also use the great profiling tools in Chrome to profile the geometry computation.
 * Being able to share code between the front and back-end is great. The same code that creates an STL file in the browser can also be used to export an STL from an API. Another example - the same validation code can be used in both areas (although the parameter validation in Shapesmith.next is not up to scratch yet).

# What's new?

## It's white

Yup, white. Walter White.

![white](/img/introducingdotnext/white.png)

## Variables

Variables allow you to truly parametrise a model. For example, you can use a radius variable for certain screw holes in your model, 3D print it, discover the holes are too small, change the variable, print it again:

![variables](/img/introducingdotnext/variables.png)

Once a proper API is created, you could create multiple versions of a model with different parameters, 3D print them all in parallel, and choose the best one. That'll be exciting. Evolutionary geometry computation using 3D printing.

## A new tree

Each model is actually a graph of objects, but for ease of use is it depicted as tree. It does have a pretty cool feature that allows you to *easily* descend the geometry hierarchy, edit something, and ascend up to the top again. In this way you can quickly edit your models:

![tree](/img/introducingdotnext/tree.png)

## New design viewer

There a new home screen where you can see all you models, and also the screen-shots of what those models looked like when you saved them:

![designs](/img/introducingdotnext/designs.png)

# A warning

<p class="warning">
Because the geometry kernel is new and still a bit experimental, you could end up with degenerate models like this:</p>

![degenerate model](/img/introducingdotnext/degenerate.png)

There are some tips to work around these problems that I will create some help for, but in the long run this has to be addressed properly. *This is a subtle pull request hint*.

# Go and try it

Head on over to [https://next.shapesmith.next](https://next.shapesmith.net/) and try it out. You don't have to create an account, just click the "try it" button. You can keep any models you create if you sign up afterwards.

If you wish, you can clone the repository and run your own server. There are instructions on Github: [https://github.com/bjnortier/shapesmith.next/](https://github.com/bjnortier/shapesmith.next/)

If you have any feedback, please feel free to contact me at [bjnortier@shapesmith.net](mailto:bjnortier@shapesmith.net). 

You can follow this project [on twitter](http://twitter.com/shapesmith).




























