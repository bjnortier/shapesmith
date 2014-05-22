---
layout: postdeprecated
title: Design management has arrived
summary: I'm happy to announce some great new additions and changes to Shapesmith that I've been working on for the last 6 weeks. These have been deployed online and version 0.3 on github. 
---

I'm happy to announce some great new additions and changes to Shapesmith that I've been working on for the last 6 weeks. These have been [deployed online](http://cloud.shaesmith.net) and version 0.3 on [github](http://www.github.com/bjnortier/shapesmith). These are:

 * User management (signin/sigup)
 * Model management (the ability to create, delete and see you models)
 * A new persistence architecture (including new undo/redo)
 * Various smaller changes like easier local install, and better preview behaviour.
 * <del>Thingiverse export</del> (almost there)

User Management
---------------

For a while now, users have been able to play with Shapesmith online, but models and users have been anonymous. Anyone could access and edit a model is they knew the url. This is obviously not a feasible strategy going forward, so online users can now create their Shapesmith account and their models will be accessible only to them.

I've tried to keep this as simple as possible, so the signup process does no verification of email address (in fact, your email address is optional and will only be used when you forget your password or username in future). Sign up to claim your username now:

<div class="center"><a href="http://cloud.shapesmith.net/signup"><img src="/img/signup.png" alt="signup"></img></a></div>

Note that if you download Shapesmith and run it locally, your username will be &ldquo;local&rdquo;, and you will not need to sign up or sign in when using the application.

Model Management
----------------

The next fairly obvious addition to Shapesmith is model management. This allows a user to see a list of their models, create new ones, and delete them:

<div class="center"><img src="/img/designs.png" alt="designs page"></img></div>

In future, this would also be the place where other users can derive or copy the public models of other users.

Renaming has not been implemented yet, but there is a [feature issue](https://github.com/bjnortier/shapesmith/issues/8) for it. 

A new persistence architecture (with new undo/redo)
---------------------------------------------------

This is the real technical meat of the last 2 months, without which user and design managent would not have been possible. I won't elaborate too much on this at this point, a blog post will describe the design soon.

The new persistence architecture is immutable. What this means is that at all times, the full history of your design is available. This does not mean that the full history is exposed through the interface, but it does create the ability to do so in future. 

The design is based on [git](http://git-scm.com). This has made things more complex, but I believe the benefit of the additional capabilities outweigh that cost. This has also solved a problem with undo/redo that existed before (which is why saving was not available).

Now, each change to the design is uniquely referenced by a &ldquo;commit&rdquo; value (like git). This commit is unique to the entire state of the model. Notice the commit value in the url:

<div class="center"><img src="/img/commit_url.png" alt="commit url"></img></div>

And where are the undo and redo buttons go? They are right here:

<div class="center"><img src="/img/undoredo.png" alt="undo redo"></img></div>

Because the state of each design is uniquely specified by the url, we can now make use of the HTML5 [History API](http://www.w3.org/TR/html5/history.html) to do undo and redo. So you can undo and redo using the browser's back and forward buttons! Awesome. This also implies that as long as you're signed in, you can load the URL of any model at any point in the designs process (i.e. bookmarks will functional properly).

And various smaller changes...
-----------------------

 * Riak is not longer required for local installs. Local installs will just write to disk.
 * When creating models, use the  &ldquo;shift&rdquo; key in conjunction with the mouse to use the current workplane values (doing this automatically caused some frustration - values would change unexpectedly)
 * Better display of errors.
 * STL Export of the whole model (instead of one component).
 * Better support for Firefox
 * Various bugfixes, minor improvements etc.

<del>Thingiverse export</del> (almost there)
------------------------------

I tried to finish export to Thingiverse for this release, but I was not able to get the upload API to work properly. The Thingiverse export from 3D Tin is also not working, so I'm not sure if the problem is on my side or theirs. Coming soon.

The future
----------

I'm proud of what has been achieved in the last few week, and I think with this solid persistence foundation I will be able to move towards adding more modelling functionality. I'm looking forward to implementing even better geometry creation, addressing problems with the tree view, and implementing new design features like bezier curves, extrusions etc. 

Happy building!<br/>
Benjamin Nortier








