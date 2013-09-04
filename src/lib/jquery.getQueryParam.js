// jQuery getQueryParam Plugin 1.0.0 (20100429)
// By John Terenzio | http://plugins.jquery.com/project/getqueryparam | MIT License
(function($){$.getQueryParam=function(param){var pairs=location.search.substring(1).split('&');for(var i=0;i<pairs.length;i++){var params=pairs[i].split('=');if(params[0]==param){return params[1]||'';}}return undefined;};})($);
