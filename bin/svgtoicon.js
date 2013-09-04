// Takes a 64x64 pixel svg and strips it to be used as an
// icon:
// 1. Remove the sodipodi and inkscape attributes
// 2. remove the explicit height and width
// 3. Add a viewBox
// 4. Strip out metadata
// 5. Remove style attributes

var libxmljs = require('libxmljs');
var fs = require('fs');

if (process.argv.length !== 4) {
    console.info();
    console.info('USAGE:');
    console.info('node svtoicon.js <inputfilename> <outputfilename>');
    console.info();
    process.exit();
}

var inputSVG = fs.readFileSync(process.argv[2]);
var xmlDoc = libxmljs.parseXmlString(inputSVG);

// console.log(inputSVG.toString());

var iconSVG = new libxmljs.Document();
var currentNode = iconSVG;

var removableElements = [/namedview/, /metadata/, /RDF/, /Work/];
var removableAttributes = [/style/, /export-ydpi/, /export-xdpi/, /export-filename/, /docname/];

var parser = new libxmljs.SaxParser();

var shouldRemove = function(str, regexs) {
    return regexs.reduce(function(acc, regex) { 
        if (regex.exec(str)) { 
            return true; 
        } else { 
            return acc; 
        }
    }, false);
}

parser.on('startElementNS', function(elem, sourceAttrs, prefix, uri, namespace) {
    var removeElement = shouldRemove(elem, removableElements);
    if (removeElement) {
        return
    }

    currentNode = currentNode.node(elem);

    if (elem === 'svg') {
        currentNode.attr('xmlns', 'http://www.w3.org/2000/svg');
        currentNode.attr('xmlns:svg', 'http://www.w3.org/2000/svg');
        currentNode.attr('viewBox', '0 0 64 64');
        currentNode.attr('version', '1.1');
    }

    sourceAttrs.forEach(function(sourceAttr) {
        var name = sourceAttr[0];
        var removeAttribute = shouldRemove(name, removableAttributes);
        if (!removeAttribute) {
            var value = sourceAttr[3];
            currentNode.attr(name, value);
        }
    })

});
parser.on('endElementNS', function(elem, attrs) {
    var removeElement = shouldRemove(elem, removableElements);
    if (removeElement) {
        return
    }
    currentNode = currentNode.parent();
});

parser.parseString(inputSVG.toString());

fs.writeFileSync(process.argv[3], iconSVG.toString());
