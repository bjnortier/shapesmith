define([], function() {

    function Stack() {
        var array = [];
        
        this.push = function(obj) {
        array.push(obj);
        }

        this.peek = function() {
        if (array.length == 0) {
            return undefined;
        }
        return array[array.length - 1];
        }

        this.pop = function() {
        if (array.length == 0) {
            throw "empty";
        }
        return array.pop();
        }
    }

    return Stack;
});