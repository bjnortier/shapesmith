define([
    'underscore',
    'backbone-events',
  ],
  function(
    _,
    Events) {

    // The job queue will manage the jobs, and put jobs in a queue
    // if there are no workers available. When a worker becomes available,
    // it will be assigned the next jon in the queue
    var JobQueue = function() {

      // Create a worker pool and an event broker. The event broker
      // will be used by the caller to listen to the job results
      var poolSize = 4;
      var workers = [];
      var worker;
      var i;
      for (i = 0; i < poolSize; ++i) {
        worker = new Worker('/src/worker.js');
        worker.onerror = function () {
          console.error("worker error", arguments);
        };
        worker.busy = false;
        worker.initialized = false;
        workers[i] = worker;
      }
      var countInitialized = 0;

      // Event broker use to listen for events. Events not on the
      // queue itself so the job queue object is not exposed externally
      var Broker = function() {
        _.extend(this, Events);
      };
      var broker = new Broker();
      this.broker = broker;

      var queue = [];
      var nextJobId = 0;

      for (i = 0; i < workers.length; ++i) {
        worker = workers[i];
        worker.onmessage = function(evt) {
          // A worker returns either the result or an error,
          // and is then available
          if (evt.data === 'initialized') {
            worker.initialized = true;
            ++countInitialized;
            if (countInitialized === poolSize) {
              broker.trigger('initialized');
            }
          } else if (evt.data.hasOwnProperty('id')) {
            var jobResult = {
              id: evt.data.id,
              csg: evt.data.csg,
            };
            broker.trigger('jobDone', jobResult);

          } else if (evt.data.info) {
            console.info('worker info:', evt.data.info);
          } else if (evt.data.error) {
            console.error('worker error:', evt.data.error);
          } else {
            console.error('unknown worker message', evt.data);
          }
          worker.busy = false;
          doNextJob(worker);
        };
      }

      this.queueJob = function(job) {
        var jobId = nextJobId++;
        job.id = jobId;
        broker.trigger('jobQueued', jobId);
        var worker = getAvailableWorker();
        if (worker) {
          doJob(job, worker);
        } else {
          queue.push(job);
        }
        return jobId;
      };

      var doJob = function(job, worker) {
        // console.log('doing job', job.id);
        worker.busy = true;
        worker.postMessage(job);
      };

      var doNextJob = function(worker) {
        if (worker.initialized && !worker.busy && queue.length) {
          var job = queue.shift();
          doJob(job, worker);
        }
      };

      var getAvailableWorker = function() {
        for (var i = 0; i < workers.length; ++i) {
          if (workers[i].initialized && !workers[i].busy) {
            return workers[i];
          }
        }
        return undefined;
      };

    };

    var jobQueue = new JobQueue();

    var createSphere = function(sha, dimensions, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, sphere: dimensions, transforms: transforms, workplane: workplane});
    };

    var createCylinder = function(sha, dimensions, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, cylinder: dimensions, transforms: transforms, workplane: workplane});
    };

    var createCone = function(sha, dimensions, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, cone: dimensions, transforms: transforms, workplane: workplane});
    };

    var createCube = function(sha, dimensions, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, cube: dimensions, transforms: transforms, workplane: workplane});
    };

    var createUnion = function(sha, childBSPs, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, union: childBSPs, transforms: transforms, workplane: workplane});
    };

    var createSubtract = function(sha, childBSPs, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, subtract: childBSPs, transforms: transforms, workplane: workplane});
    };

    var createIntersect = function(sha, childBSPs, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, intersect: childBSPs, transforms: transforms, workplane: workplane});
    };

    var createMesh = function(sha, csg, transforms, workplane) {
      return jobQueue.queueJob({sha: sha, mesh: csg, transforms: transforms, workplane: workplane});
    };

    return {
      createCube     : createCube,
      createSphere   : createSphere,
      createCylinder : createCylinder,
      createCone     : createCone,
      createUnion    : createUnion,
      createSubtract : createSubtract,
      createIntersect: createIntersect,
      createMesh     : createMesh,
      broker         : jobQueue.broker,
    };

  });
