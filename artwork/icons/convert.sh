#!/usr/bin/env sh
for i in *.svg; 
do 
echo $i
node ../../bin/svgtoicon.js $i ../../src/icons/$i; 
done
