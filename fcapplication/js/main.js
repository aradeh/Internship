//* main program */

define(['require', 'Map', 'OnlineMonitor','CarbonWizard','CarbonData','CarbonDataView','AppPreferences','AppPreferencesView','LegendView','utils/MeasureUnitConverter','text!templates/Splash.html'
	],function(require) {

	var mapModule = require('Map');

	var osm = require('OnlineMonitor');
	var wizard = require('CarbonWizard');
	var carbonData = require('CarbonData');
	var carbonDataView = require('CarbonDataView');
	var appPreferences = require('AppPreferences');
	var appPreferencesView = require('AppPreferencesView');
	var muc = require('utils/MeasureUnitConverter');
	var templateSplash = require('text!templates/Splash.html');
	var legendView = require('LegendView');

	appPreferences.init();
	osm.init();
	wizard.init(appPreferences.getPrefs());
	carbonData.init();

    legendView.init();

	var startAction = ''; //action to be taken after splash closed

	$(function(){

        $('#splashMdl').remove();
		var compiledTemplate = _.template(templateSplash);
		$('body').append( compiledTemplate() );

		//TODO - no timeout
		setTimeout(showSplash, 1000);

		function showSplash(){ $('#splashMdl').modal('show'); }
		$('#splashMdl').on('shown.bs.modal', function(e) {
			initStartModal();
		});

		$('#btnGetStarted').click(function(e){
			mapModule.clearMap();
			var isOnline = true;
			wizard.startWiz( isOnline );
		});

		var clickStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: [200, 100, 100, 0.75],
				width: 4
			}),
			fill: new ol.style.Fill({
				color: 'rgba(0,255,255,0.3)'
			})
		});

		$('#btnMapLayers').click(function(e){
			appPreferencesView.init(appPreferences);
			appPreferencesView.render();
		});

		$('#btnLastResults').click(function(e){
			//mapModule.loadCountiesFromLocalStorage();
			
			carbonDataView.init(carbonData.getDataSets());
			carbonDataView.render(appPreferences.getMeasureSystem());

		});

		/* ------- messaging switchboard -------- 
			process events from different modules
		*/ 

		$(document).on('wiz:wizCounties:closed', function(e) {
			var countyIds = e.countyIds;
			var ftrs = {}
			ftrs.features = mapModule.getCountyFeaturesById(countyIds);
			ftrs.type = 'County';
			carbonData.getDataFromFeatures(ftrs);
		});

		$(document).on('wiz:wizWatersheds:closed', function(e) {
			var opts = wizard.getChosenOptions();
		});

		$(document).on('wiz:wizRadius:closed', function(e) {
			var opts = wizard.getChosenOptions();
			opts.measureSystem = appPreferences.getMeasureSystem();
			mapModule.drawRadius(opts);
		});

		$(document).on('wiz:wizLocationMethod:GPSSelected', function(e) {
			mapModule.gotoUserLocation();
		});

		$(document).on('wiz:wizLocationMethod:countySelected', function(e) {
			mapModule.startCounties();
		});
		
		$(document).on('wiz:wizGoToUserLocation:complete', function(e) {
			if(e.dontOpenRadius == false) {
				wizard.setMapPoint(mapModule.getUserLocation());
				$('#wizRadius').modal('show');
			}
		});		

		$(document).on('appPreferencesView:closed', function(e) {
		});

		$(document).on('CarbonData:loadCarbonData', function(e) {
			carbonDataView.init(carbonData.getDataSets());
			carbonDataView.render(appPreferences.getMeasureSystem());
		});

		$(document).on('CarbonData:getDataFromFeatures', function(e) {
			carbonDataView.init(carbonData.getDataSets());
			carbonDataView.render(appPreferences.getMeasureSystem());
		});

		//map click - see if wizard is waiting, and start radius dialog
		$(document).on('Map:singleClick', function(e) {
			if( wizard.isWaitingForMapPoint ) {
				wizard.setMapPoint(e.mapPoint);
				mapModule.setMapPoint(e.mapPoint);
				$('#wizRadius').modal('show');
			} 
		});

		//map mouseup, after features are drag-selected
		$(document).on('Map:mouseUpFeatures', function(e) {
			var ftrs = e.dragFtrs;
			ftrs.type = 'County';
			carbonData.getDataFromFeatures(ftrs);
		});

		//map mouseup, after radius is drawn (drawed?)
		$(document).on('Map:mouseUpRadius', function(e) {
			//var ftrs = e.dragFtrs;
			var pt = e.mapPoint;
			var r = e.radiusLength; 
			serviceRequestRadius(pt, 'meters', r);
		});

		// new features loaded in countyLayer 
		$(document).on('Map:countyFeaturesUpdated', function(e) {
			wizard.updateCounties(e.countiesAndStates);
		});

		$(document).on('CarbonDataView:closed', function(e) {
			//debugger;
			$('#dragRadiusHover').remove();
			mapModule.clearMap();
		});

		$(document).on('appPreferencesView:changeBasemap', function(e) {
			mapModule.changeBasemap(e.layerName);
		});

        $(document).on('appPreferencesView:showHideLayer', function(e) {
			mapModule.showHideLayer(e.layerName, e.checked);
		});
        $(document).on('appPreferencesView:showHideCarbonLayer', function(e) {
		    mapModule.showHideCarbonLayer(e.layerName, e.checked);
		    showHideLegend(appPreferences.carbonLegendVisible());
		});

		$(document).on('appPreferencesView:showHideLegend', function(e) {
		    showHideLegend(e.checked);
        });
		$(document).on('carbonLegendView:hideLegend', function(e) {
		    appPreferences.carbonLegendVisible(false);
		    showHideLegend(false);
        });

		$(document).on('appPreferencesView:setMeasureSystem', function(e) {
		    showHideLegend(appPreferences.carbonLegendVisible());
        });

		/* ------- END messaging switchboard -------- */ 
	});
    function showHideLegend(show) {
            legendView.render(appPreferences.getPrefs());
			if(show) {
				$('#carbonLegendDiv').show();
			} else {
				$('#carbonLegendDiv').hide();
			}

    }

	function initStartModal() {

		$('#btnSplashAbout').click(function(e) {
			$('#splash1').hide();
			$('#splash3').hide();
			$('#splash2').show();
		});
		$('#btnSplashGetStarted').click(function(e) {
			$('#splash1').hide();
			$('#splash3').show();
			$('#splash2').hide();
		});

		$('#startWizCounty').click(function(e) {
			$('#splashMdl').modal('hide');
			startAction = 'wizCounty';
		});
		$('#startDragCounty').click(function(e) {
			$('#splashMdl').modal('hide');
			startAction = 'dragCounty';
		});

		$('#startGpsRadius').click(function(e) {
			$('#splashMdl').modal('hide');
			startAction = 'gpsRadius';
		});	
		$('#startRadius').click(function(e) {
			$('#splashMdl').modal('hide');
			startAction = 'startRadius';
		});
		$('.apptitle').click(function(e) {
			$('#splashMdl').modal('show');
		});	

		//see which option they selection from the #start... buttons above
		$('#splashMdl').on('hidden.bs.modal', function(e) {

			if( startAction == 'wizCounty' ) {
				mapModule.gotoUserLocation(true);
				mapModule.startCounties();
			} else if( startAction == 'dragCounty' ) {
				//mapModule.zoomToCountyLevel();
			} else if( startAction == 'gpsRadius' ) {
				mapModule.gotoUserLocation();
			} else if( startAction == 'startRadius' ) {

			}

		});
	}

	function testShowCountyData() {
		carbonData.testLoadCarbonData('County');
		carbonDataView.init(carbonData.getDataSets());
		carbonDataView.render();
		mapModule.clearMap();
	}

	function testShowWatershedData() {
		carbonData.testLoadCarbonData('Watershed');
		carbonDataView.init(carbonData.getDataSets());
		carbonDataView.render();
		mapModule.clearMap();
	}

	function testShowRadiusData() {
		carbonData.testLoadCarbonData('Radius');
		carbonDataView.init(carbonData.getDataSets());
		carbonDataView.render();
		mapModule.clearMap();
	}

	function serviceRequestRadius(centerPoint,units,length) {
		var requests = [];
		var request = {};
		request.type = 'Radius';
		request.centerPoint = centerPoint;
		request.units = units;
		request.radius = length;
		requests.push(request);
		carbonData.loadCarbonData(requests);
	}

	function mapGotoGPS () {

	}	

});
