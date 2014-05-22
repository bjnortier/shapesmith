define([
    'jquery',
    'lib/jquery.getQueryParam',
    'underscore',
    'backbone',
    'stack',
  ], function($, __$, _, Backbone, Stack) {

    var CommandStack = function() {

      var undoStack = new Stack();
      var redoStack = new Stack();

      _.extend(this, Backbone.Events);

      this.do = function(command, newVertices) {

        var successFn = function(sha) {
          command.fromCommit = $.getQueryParam("commit");
          var url = window.location.pathname + '?commit=' + sha;
          history.pushState({commit: sha}, sha, url);
          command.toCommit = sha;
          undoStack.push(command);
          return {newVertices: newVertices};
        };
        var errorFn = function(msg) {
          console.error(msg);
          return {error: msg};
        };
        return command.do(successFn, errorFn);

      };

      this.undo = function() {
        if (!this.canUndo()) {
          throw new Error("Nothing to undo");
        }
        undoStack.peek().undo();
        redoStack.push(undoStack.pop());
      };

      this.redo = function() {
        if (!this.canRedo()) {
          throw new Error("Nothing to redo");
        }
        redoStack.peek().redo();
        undoStack.push(redoStack.pop());
      };

      this.canUndo = function() {
        return undoStack.peek() !== undefined;
      };

      this.canRedo = function() {
        return redoStack.peek() !== undefined;
      };


      this.pop = function(commit) {
        this.trigger('beforePop');

        if (undoStack.peek() && undoStack.peek().fromCommit === commit) {
          console.info('UNDO: ' + undoStack.peek().fromCommit);
          this.undo();
          this.trigger('afterPop');
          return true;
        }

        if (redoStack.peek() && redoStack.peek().toCommit === commit) {
          console.info('REDO: ' + redoStack.peek().toCommit);
          this.redo();
          this.trigger('afterPop');
          return true;
        }

      };

    };

    return new CommandStack();

  });
