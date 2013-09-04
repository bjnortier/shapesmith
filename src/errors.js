var SS = SS || {};

SS.render_errors = function(errors) {
    $('.errors').hide();
    for (key in errors) {
	var errorDivId = '#' + key + '-errors'
	$(errorDivId).css('border', 'solid thin red');
	$(errorDivId).text(errors[key]);
	$(errorDivId).show();
    }
}
