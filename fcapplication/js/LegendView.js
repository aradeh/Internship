define(['text!templates/LegendView.html'],function(template) {

    var dragEl, xPtr, yPtr, xEl, yEl;

    var legendDataMock = {
        system: 'metric',
        cabonIn: 'metric',
        ranges: 
            { 
                US:         ['< 0','1-5','6-10','11-15','16-20','> 20'],
                metric:     ['< a','a-b','c-d','e-f','g-h','> h'],
            },
        colors: ['red','blue','white','yellow','green','orange']
    };
	var self;

	function setupHandlers() {
		
		$('#carbonLegendDiv .closeLegend > span').click(function(e){
            if( $('#appPreferencesForm input[name=shLegend][type=checkbox]').prop('checked') ) {
                $('#appPreferencesForm input[name=shLegend][type=checkbox]').click();
            } else {
		        $('#carbonLegendDiv').hide();    
            }
        });
        
        $('#carbonLegendDiv').on('mousedown', function() {
            $(this).addClass('dragging').on('mousemove', function(e) {
                $('.dragging').offset({
                    top: e.pageY - $('.dragging').outerHeight() / 2,
                    left: e.pageX - $('.dragging').outerWidth() / 2
                }).on('mouseup', function() {
                    $(this).removeClass('dragging');
                });
                e.preventDefault();
            });
        }).on('mouseup', function() {
            $('.dragging').removeClass('dragging');
        });
	}

	function render(appPreferences) {
		var ranges = appPreferences.ranges;
        var cLayer= appPreferences.cLayer;
        var layerRange = ranges[cLayer];
        range = layerRange[appPreferences.measureSystem];
		$('#carbonLegendDiv').remove();
        var data = {};
        data.range0 = range[0];
        data.range1 = range[1];
        data.range2 = range[2];
        data.range3 = range[3];
        data.range4 = range[4];
        data.range5 = range[5];
        var mt = ranges['measureText'];
        data.measureText = mt[appPreferences.measureSystem];
		var compiledTemplate = _.template(template);
		$('body').append(_.template(compiledTemplate(data)));
		setupHandlers();
	};

	function init() {
		self = this;
		self.template = template;
        self.legendDataMock = legendDataMock;

	};  

	return {
		init: init,
		render: render
	};

});
