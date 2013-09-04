define(['jquery', 'casgraph/replicator'], function($, Replicator) {

    var AJAXReplicator = function(vertexUrl, graphUrl) {

        var writeVertex = function(hash, vertex, callback) {
            write(vertexUrl, hash, vertex, callback);
        }

        var writeGraph = function(hash, graph, callback) {
            write(graphUrl, hash, graph, callback);
        }
        
        var write = function(url, hash, object, callback) {
            
            $.ajax({
                type: 'POST',
                url: url,
                contentType: 'application/json',
                data: JSON.stringify(object),
                dataType: 'json',
                success: function(serverHash) {
                    if (serverHash === hash) {
                        callback(true);
                    } else {
                        callback(false, 'error: server hash doesn\'t match. Expected: ' + hash + ' received: ' + serverHash);
                    }
                },
                error: function(result) {
                    callback(false, result);
                }
            });

        }

        var readVertex = function(hash, callback) {
            read(vertexUrl, hash, callback);
        }

        var readGraph = function(hash, callback) {
            read(graphUrl, hash, callback);
        }
        
        var read = function(url, hash, callback) {

           $.ajax({
                type: 'GET',
                url: url + hash,
                dataType: 'json',
                success: function(result) {
                    callback(true, hash, result);
                },
                error: function(msg) {
                    callback(false, msg);
                }
            });

        }


        var readers = {
            graph: readGraph,
            vertex: readVertex,
        }

        var writers = {
            vertex: writeVertex,
            graph: writeGraph,
        }

        Replicator.prototype.constructor.call(this, readers, writers);
    }

    return AJAXReplicator;


});