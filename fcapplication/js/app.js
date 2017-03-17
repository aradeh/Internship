/* config and boot file for require app - launched by data-main attribute */


//require config options set in script on index 
/*require.config({

	baseUrl:'js',
	waitSeconds: 200,
	paths: {
        jquery:     'libs/jquery/jquery',
        openlayers: 'libs/ol/ol-debug',
        bootstrap:  'libs/bootstrap/js/bootstrap'
	},
	shim: {
		bootstrap: {
			deps: ['jquery']
		}
	}
});*/

// right now, debug version of ol works with loader, regular version does not;
//  however, ext.rbrush is broken in ol debug
//https://github.com/openlayers/ol3/issues/3155
//temp fix until patched - assign ol global here, and don't use ol debug version
var ol;

//using nested requires to get global refs ready prior to instantiating Main
require(['jquery', 'openlayers', 'backbone', 'bootstrap'], function($, ol, Backbone){
	//debugger;
	this.ol = ol;
	
	Backbone.eventsOnlineMonitor = _.extend({}, Backbone.Events);

	require(['main'], function(Main){
		//debugger;
	});

	
	$(function(){
		//console.log('app.js domready');
	});
});
