---
layout: postdeprecated
title: Progress update
summary: If you look at Shapesmith's Github repository you might get the impression that not much is happening with Shapesmith. But the opposite is true so I want to tell you what's been happening and what will happen in the next couple of months.
---

If you look at Shapesmith's Github repository you might get the impression that 
not much is happening with Shapesmith. But the opposite is true so I want 
to tell you what's been happening and what will happen in the next couple of months.

Let me start with what I've been up to - I've been building a tool based on Shapesmith technology for someone as a freelance project. I can't reveal too much yet, but it's in the Building Information Management space.

The beauty of this project is that it is split into two parts:

 1. Proprietary extensions for the Shapesmith platform
 1. Extensions to the open-source application

This new application is essentially a fork, and not on Github at the moment. It's a significant departure from the current version. I would have preferred to keep things up to date on Github but the time constraints have not made this possible. Even though Shapesmith hasn't had a "version 1", let's call this "version 2".

So what's coming in "version 2"?

 1. Variables. Object graphs instead of trees. Other nice things like colors and a new toolbar-based GUI.
 1. A Javascript-only mesh-based architecture.

## Variables and the object graph

In "version 1", objects were trees. You could use booleans and other operations to create a resulting shape, but a shape could not be depended on by more than one shape.

"Version 2" uses a graph. This is necessary for variables (more than one object can depend on the same variable). And since we supprt it for variables, we can support multiple dependencies on other objects (e.g. points). It will be possible to use an anchor point for more than one object, and if you move the anchor point, both parents will update.

There are also other nice things like colors, a more traditional GUI with toolbar(s), a new color scheme (white-ish instead of the current black), and model previews.

## Javascript-only mesh-based architecture

This is really the crux of what's I'm planning.

When I started this project I looked at what's available and cobbled them together in a nice WebGL interface. I needed a solid modelling library, and I concentrated on finding a Brep-based solid modeller. I decided on OpenCASCADE (OCC), mostly because I was familiar with Brep and there was nothing else available that looked useful enough *and* was permissively licensed (NOT GPL).

Because OCC is C++ the architecture uses an Erlang application to manage the OCC process and "feed" it data, receiving data back and sending the result to the browser. 

Over the history of the project this has led to some painful issues:

  1. The architecture is complicated. It uses 3 languages (Javascript, Erlang, C++) and runs multiple Erlang VMs. This is a huge barrier to entry to contribution for an open-source project. It also a nightmare to install.
  1. OCC doesn't scale to moderately complex boolean operations. And when it does handle operations, it uses a lot of memory and CPU power. This is serious problem for a hosted application (i.e. a lot of resources are needed to host the application for many users).
  1. OCC doesn't lend itself to extension due to it's extreme complexity.

Notice the theme? The OCC decision has dramatically influenced the architecture. And not necessarily OCC, but any C/C++ back-end based solid modelling architecture.

What would the ideal be? It would be:

 1. A simple architecture with one language and tooling that can be shared in the browser and the backend.
 1. Using the CPU power of the browser to do the solid modelling (essentially distributing computation to the browser).

Since the vast bulk of source code for the application is the Javascript in the browser, the first goal can only be achieved by doing everything in Javascript. This implies a Javascript backend. I've been doing some work with node.js and I am now of the opinion that unifying the client and browser using one language with sharable code is a *major* advantage. In this ideal world, the install procedure would be:

    npm install shapesmith

Compare that to the hoops that need to be jumped throught at the moment.

The second goal can only be achieved by running the solid modelling in the browser. Independant of goal 1, this could potentially be done by porting a C/C++ library to JS using [EMScripten](http://emscripten.org). But this conflicts with the first goal. Is there a Javascript solid modelling library? The closest that might fits the bill I'm aware of is [Plasm.js](http://cvdlab.github.com/plasm.js/), a JS port of Plasm. This doesn't appear support boolean operations at present.

As a result I've been working on a Javascript discrete solid modeller (not continuous BRep). Discrete as in mesh-based, similar to a bitmap versus a vector image. This doesn't mean the definition of models will be mesh-based, but the result will be. This fits the goal of being a tool for 3D printing - which mainly requires STL export.

This approach will have some disadvantages:

 1. A lot of work is required on the solid modelling aspect in the short term.
 1. Not being able to easily do CAD format exports.
 1. Duplication of effort in the solid modelling area.

And many advantages:

 1. A very simple install procedure.
 1. Mouch lower barrier to contribution.
 1. Control over the solid modelling library.
 1. Common testing tools.
 1. Sharable code.
 1. Hypothetical offline usage in the future.

So that's the plan.

Once I have a critical mass of functionality done for "version 2" I'll put it online so you can see the future direction of the tool. I will keep the current version online at [shapesmith.net](http://shapesmith.net) until similar functionality is available in the new application. 

Thoughts?






















