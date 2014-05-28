---
layout: post
title: Now featuring STL import
summary: This has been a feature that has been requested a couple of times, and one of the drivers to moving to a new mesh-based architecture. The stumbling block was a classic case of "Not Invented Here" syndrome.
---

tl;dr: Shapesmith now has STL import

This has been a feature that has been requested a couple of times, and one of the drivers to moving to a new mesh-based architecture. The stumbling block was a classic case of "Not Invented Here" syndrome.

I tried doing too much, and underestimated the effort required to create a mesh kernel that could do booleans. I tried creating a new robust boolean kernel from fairly recent papers published, but looking back I should have just used [csg.js](http://evanw.github.io/csg.js/). My kernel suffered from robustness issues, especially when trying to do an STL import, and was slower than csg.js.

Well I finally overcame the [sunk cost fallacy](http://en.wikipedia.org/wiki/Sunk_costs) and replaced my own home-grown kernel with csg.js. This took all of a day.

So now we have STL imports! CSG.js is pretty snappy. And you can do funky things like slicing up bunnies:

![Bunnies](/img/www/stlimport.png)

Enjoy :)