
var require = {
	baseUrl:'js',
	paths: {
	    jquery:     'libs/jquery/jquery',
	    openlayers: 'libs/ol/ol',
	    openlayersdebug: 'libs/ol/ol-debug',
	    bootstrap:  'libs/bootstrap/js/bootstrap',
	    backbone: 'libs/backbone/backbone',
	    underscore: 'libs/backbone/underscore',
	    json2: 'libs/backbone/json2',
	    chart: 'libs/chart/Chart',
	},
	shim: {
		bootstrap: {
			deps: ['jquery']
		},
		backbone: {
			deps: ['jquery','underscore'],
			exports: 'Backbone'
		},
		underscore: {
			exports: '_'
		},
	}
}
