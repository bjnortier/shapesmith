define([], function() {

    function Command(doFn, undoFn, redoFn) {
        var executeFn = executeFn;
        var undoFn = undoFn;
        var redoFn = redoFn;

        this.do = function(successFn, errorFn) { 
            return doFn(successFn, errorFn); 
        };

        this.undo = function() { 
            undoFn(); 
        };

        this.redo = function() { 
            redoFn(); 
        };
    }

    return Command
});