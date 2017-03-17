/* Map.js - instantiates map, map controls and interactions.
	- Selecting features and drawing radius
		is acheived by a mix of ol interactions, map events, 
		and browser events

*/
define(['utils/MeasureUnitConverter','text!templates/MapLayers.html'
	],function(unitConverter,template_mapLayers) {

	var map = {};

	//names of selected objects (might use ids or do deep-check of obj)
	var dragFtrs = { names:[], features:[] };

	//var extent = new ol.Extent{[-17586848, 1865930, -5317788, 6894875]};


	/*  --- start bbox, dynamic feature loading from wfs  */

	var vsStrategyBbox;

    var countiesLoading = false;
    //could not get callback set in url string, using ajax success
    function loaderFunction(extent, resolution, projection) {
    	//console.log('loader function called');
    	countiesLoading = true;

        var url = FCA_APP.GEOSERVER+
            	'ows?service=WFS&version=1.0.0&request=GetFeature'+
            	'&typeName=ForestCarbon:counties&maxFeatures=800'+
            	'&outputFormat=application%2Fjson'+
                '&bbox=' + extent.join(',');
        $.ajax({
            url: url,
            dataType: 'json'
        }).success(function(data){

        	countiesLoading = false;
        	loadFeaturesBbox(data);
        }).fail(function(xhr,msg,err){
        	//console.log('ERR - ajax load counties - ' + err);
        	
	        var ftrs = loadCountiesFromLocalStorage();
	        countyFeaturesUpdated(ftrs);
        }).always(function(){
        	//console.log('Counties ajax always');
        });
    };

    var loadFeaturesBbox = function(response) {
        var ftrs = vsStrategyBbox.readFeatures(response);
        vsStrategyBbox.addFeatures(ftrs);
	    countyFeaturesUpdated(ftrs);
    };
		
    var carbonLayer_TOTAL,
				carbonLayer_ag,
				carbonLayer_bg,
				carbonLayer_dd,
				carbonLayer_lt,
				carbonLayer_sd,
				carbonLayer_so,
				carbonLayer_us;

    // function to message main with updated features - main will pass them to the wiz
    //  creates an array of states and counties
	function countyFeaturesUpdated(features) {
		localStorage.clear();
		var countiesAndStates = [];
		var format = new ol.format.GeoJSON();
		features.forEach( function(f){
			var s = f.get('state');
			var c = f.get('name');
			var g = f.get('geoid');
			countiesAndStates.push({State:s,County:c,geoid:g});
			//store for offline use
			localStorage.setItem(g, format.writeFeature(f) ); 
		});

		var ev = jQuery.Event( "Map:countyFeaturesUpdated", {countiesAndStates:countiesAndStates});
		$('body').trigger(ev);		
	}

	function getCountyFeaturesById(ids) {
		var features = [];
		var source = countyLayer.getSource();

        var insertedGids = [];
		source.forEachFeature( function(feature) {
			var gid = feature.get('geoid');
			if(( ids.indexOf( gid ) != -1) && ( insertedGids.indexOf( gid ) == -1 )) {
                insertedGids.push(gid);
                features.push(feature);
				//console.log(feature.getProperties());
			}
		});	
		return features;
	}

    // loads features to county layer when offline
	function loadCountiesFromLocalStorage () {
		var cSource = countyLayer.getSource();
		var geojsonObject = {
		  'type': 'FeatureCollection',
		  'crs': {
		    'type': 'name',
		    'properties': {
		      'name': 'EPSG:3857'
		    }
		  },
		  'features': [

		  ]
		};

		var vectorSource = new ol.source.Vector({
  			features: (new ol.format.GeoJSON()).readFeatures(geojsonObject)
		});

		countyLayer.setSource(vectorSource);

		var features = [];
		var countiesAndStates = [];
		var format = new ol.format.GeoJSON();
		for(var i=0; i < localStorage.length; i++){
		    var geoid = localStorage.key(i);
			features.push( format.readFeature(localStorage.getItem(geoid)) );
		}

		vectorSource.addFeatures(features);
		return features;
	}


    /*  --- 			END bbox  */

	var format = 'image/png';

	var stateLayer;

	var userLocation = null;

	$(function(){

		init();

        $('#btnDragSelect').on('click', function(e){

			if( !doingRadius ) {
				startDragSelecting();
			}
		});

		
		$('#btnDragRadius').on('click', function(e){
			if(!dragSelectingState) {
				doingRadius = true;
				clearMap();
				customPointer.setActive(true);
				dragPanInteraction.setActive(false);

				$('#alertXY').empty();
				$('#alertXY')
					.append('Tap the map, and hold down to draw a radius');
				$('#alertDone').show();
				buttonsOff();
			}

		});

		$('#btnDragOK').on('click', function(e){

			if( doingRadius )  {
				doingRadius = false;
				customPointer.setActive(false);
				dragPanInteraction.setActive(true);
				
				//announce to main - call radius
				var ev = jQuery.Event( "Map:mouseUpRadius", {mapPoint:radiusCoordStart, radiusLength:radiusLength});
				$('body').trigger(ev);

				$('#alertDone').hide();
				buttonsOn();
			}
			if( dragSelectingState ) {
				stopDragSelecting();
			}
		});

		$('#btnDragCancel').on('click', function(e){
			if( doingRadius )  {
				doingRadius = false;
				clearMap();
				customPointer.setActive(false);
				dragPanInteraction.setActive(true);

				$('#alertDone').hide();
				buttonsOn();
			}
			if( dragSelectingState ) {
				clearMap();
				$('#alertDone').hide();
				$('#alertXY').empty();
				dragSelectingState = false;
				dragPanInteraction.setActive(true);
			}
		});

	});


	function buttonsOff () {
		$('#btnDragRadius').prop('disabled',true);
		$('#btnGetStarted').prop('disabled',true);
		$('#btnMapLayers').prop('disabled',true);
		$('#btnAbout').prop('disabled',true);

		if( map.getView().getResolution() < 2200 ) {
			$('#btnDragSelect').prop('disabled',false);
		} else {
			$('#btnDragSelect').prop('disabled',true);
		}
	}

	function buttonsOn () {
		$('#btnDragRadius').prop('disabled',false);
		$('#btnGetStarted').prop('disabled',false);
	    $('#btnMapLayers').prop('disabled',false);
		$('#btnAbout').prop('disabled',false);

		if( map.getView().getResolution() < 2200 ) {
			$('#btnDragSelect').prop('disabled',false);
		} else {
			$('#btnDragSelect').prop('disabled',true);
		}
	}

	function getUserLocation(){
		return userLocation;
	}

	//param dor added to allow going to loc, but signaling main() not to open radius dialog
	function gotoUserLocation(dor) {
		if(typeof dor === 'undefined') {
			dor = false;
		} 
		var dontOpenRadius = dor;

		if ("geolocation" in navigator) {
			//blocking call - takes two cb functions, success and fail
			navigator.geolocation.getCurrentPosition(function(position) {
				var pt = [position.coords.longitude, position.coords.latitude];
				pt = ol.proj.transform(pt, 'EPSG:4326', 'EPSG:3857');
				userLocation = pt;
				openRadius = pt;
				map.getView().setCenter(pt);
				map.getView().setZoom(8);
				var ev = jQuery.Event( "wiz:wizGoToUserLocation:complete", {dontOpenRadius:dontOpenRadius});
				$('body').trigger(ev);
			});
		} else {
			alert('Cannot detect your location - please draw or select from the map.');
		}
	}
	//TODO - moving to app prefs
	function showMapLayersModal() { 
		$('#mapLayersModal').on('shown.bs.modal', function(e){
			$("#mapLayersForm input[name='basemap']").change(function(e){
				var selected = $(this).val();
				var layers = map.getLayers();
				layers.forEach( function(layer) {
					if( layer.get('isBasemap') ) { 
						layer.set('visible', (  layer.get('myHandle') == selected) );
					}
				});
			});
			$("#mapLayersForm input[type=checkbox]").on('click',function(e){

				var checked = $(this).prop('checked');
				var name = $(this).val();
		
				var layers = map.getLayers();
				layers.forEach( function(layer) {
					if( layer.get('myHandle') == name ) { 
						layer.set('visible', checked );
					}
				});
			});
		});
		$('#mapLayersModal').modal('show');

	}

	function startDragSelecting() {
		console.log('startDragSelecting');
		if( vecSource ) {vecSource.clear()};
		dragSelectingState = true;
		dragPanInteraction.setActive(false);

		$('#alertXY').empty();
		$('#alertDone').show();
		$('#alertXY')
			.append('Tap or drag over one or more counties');
	}

	function stopDragSelecting() {
		console.log('stopDragSelecting');

		$('#alertDone').hide();
		$('#alertXY').empty();
		dragSelectingState = false;
		dragPanInteraction.setActive(true);
		var ev = jQuery.Event( "Map:mouseUpFeatures", {dragFtrs:dragFtrs});
		$('body').trigger(ev);	
	
	}

	var defaultCountyStyle = new ol.style.Style({
		            stroke: new ol.style.Stroke({
						color: [153,153,0, 0.75],
						width: 3
		            })
                });
	
	function unStyleSelectedFeatures(features) {
		for(var x=0;x<features.length;x++){
			features[x].setStyle(null);
            //setStyle(null) does not work for last selected feature
			features[x].setStyle(defaultCountyStyle);
		}
	}

	var dragSelectingState = false;

	var dragPanInteraction;
	
	var dragStyle;

	
	/*---- drag radius ---*/

	var radiusCoordStart;
	var radiusCoordStop;
	var dragRadiusState = false;
	var doingRadius = false;

	var customPointer;

	//start radius draw
	function pDown(e) {
		if(!dragRadiusState){ dragRadiusState = true };
		radiusCoordStart = e.coordinate;
	}
	function pDrag(e) {
		//console.log('drag');
	}
	function pMove(e) {
		if(!dragRadiusState) return;
		radiusCoordStop = e.coordinate;
		drawRadiusFeature(radiusCoordStart,radiusCoordStop);
		
		if(isDragging && dragRadiusState) {
			line = new ol.geom.LineString([radiusCoordStart, radiusCoordStop]);
			console.log('a'+line.getLength().toFixed(0));

			console.log('b'+lengthTransformed);

			//var lg = line.getGeometry();
			//line.transform(ol.proj.getTransform('EPSG:3857', 'EPSG:4326'));
			//line.setGeomety(lg);
			
			radiusLength = line.getLength().toFixed(0);
			
			// transformed
			var p1 = ol.proj.transform(line.getFirstCoordinate(), "EPSG:3857", 'EPSG:4326');
			var p2 = ol.proj.transform(line.getLastCoordinate(), "EPSG:3857", 'EPSG:4326');
			var wgs84sphere = new ol.Sphere(6378137); 
			var lengthTransformed = wgs84sphere.haversineDistance(p1, p2);
			radiusLength = lengthTransformed;

			var km = (radiusLength/1000).toFixed(0);
			var mi = (km * .62138).toFixed(0);
			$('#alertXY')
				.html('Radius: '+km+" km -- "+mi+" mi");
		}
	}
	function pUp(e) {
		//console.log('up');
	}

	
	var isDragging;
	var radiusLength = 0;

	// event does not work in some mobile, iPhone eg 4, ipad
	var mapEl = document.querySelector('#map');
	mapEl.addEventListener( 'mousemove', function(e){

	});

	var selectStyle, selectInteraction;


	//up and drag are being overridden, or don't work
	window.onmouseup = function(e){
		if(dragRadiusState) {
			dragRadiusState = false;
			drawRadiusFeature(radiusCoordStart,radiusCoordStop);
		}
		if(dragSelectingState) {
		}
	}
	// vars for drawing circle, and radius line
	var circleFeature, vecSource, vecLayer; 

	//draw radius based on mouse position
	function drawRadiusFeature( pointStart, pointEnd ) {	
		// create linestring, or use distanceTo fun

		line = new ol.geom.LineString([pointStart, pointEnd]);
		
		radiusLength = line.getLength();

		//TODO - probably redundant from draw

		//re-measure line on sphere 
		var p1 = ol.proj.transform(line.getFirstCoordinate(), "EPSG:3857", 'EPSG:4326');
		var p2 = ol.proj.transform(line.getLastCoordinate(), "EPSG:3857", 'EPSG:4326');
		var wgs84sphere = new ol.Sphere(6378137); 
		var lengthTransformed = wgs84sphere.haversineDistance(p1, p2);
		radiusLength = lengthTransformed;

		if( vecSource ) {vecSource.clear()};
		vecSource = new ol.source.Vector({
			projection: 'EPSG:3857'
		});

		var proj = vecSource.getProjection();

		vecLayer = new ol.layer.Vector({
			source: vecSource
		});

		circleFeature = new ol.Feature({
			geometry: new ol.geom.Circle(pointStart, line.getLength()),
			//labelPoint: new ol.geom.Point(mnPt),
			name: 'carb radius'
		});

		//circleFeature.set('name', 'a property to hold the feature name');			
		vecSource.addFeature(circleFeature);

		map.addLayer(vecLayer);
	}
	/* end drag radius -- */

	//draw radius with passed in options, from wizard via main
	// param options includes options.radius (in KM or MI) and options.mapPoint
	function drawRadius( options ) {	

		// TODO - this is a fix for jump from wizard
		if(typeof opts === 'undefined') {
			opts = {};
			opts.measureSystem = 'Metric';
		}
		
		var length; 
		if( opts.measureSystem == 'US' ) {
			length = unitConverter.milesToKm(options.radius) * 1000;
		} else {
			length = options.radius * 1000;
		}

		if( vecSource ) {vecSource.clear()};
		vecSource = new ol.source.Vector({
			projection: 'EPSG:3857'
		});

		var proj = vecSource.getProjection();
		vecLayer = new ol.layer.Vector({
			source: vecSource
		});

		circleFeature = new ol.Feature({
			geometry: new ol.geom.Circle(options.mapPoint, length),
			name: 'carb radius'
		});
		
		vecSource.addFeature(circleFeature);

		map.addLayer(vecLayer);

		var ev = jQuery.Event( "Map:mouseUpRadius", {mapPoint:options.mapPoint, radiusLength:length});
		$('body').trigger(ev);
	}

	function showLayer(layerName, show) {
		var layer;

		if( layerName == 'countyLayer' ) {
			layer = countyLayer;
		} else if ( layerName == 'watershedLayer' ) {
			layer = watershedLayer;
		}

		if( show ) {
			map.addLayer(layer);
		} else {
			map.removeLayer(layer);
		}
	}

	function setMapPoint(pt) {
		map.getView().setCenter(pt);
		map.getView().setZoom(9);
	}

	function clearMap() {
		if(vecSource){vecSource.clear()};
		var source = countyLayer.getSource();
		unStyleSelectedFeatures(source.getFeatures());

		dragFtrs.names = []; dragFtrs.features = [];
		//selectInteraction.unselectAll();
	}

	function addToDragFeatures(feature) {

		if( dragFtrs.names.indexOf(feature.get('geoid')) == -1 ) {
			dragFtrs.names.push(feature.get('geoid'));
			dragFtrs.features.push(feature);
			feature.setStyle(dragStyle);
		}
		var ftrNames = [];
		$.each(dragFtrs.features, function(idx, val) {
			ftrNames.push(val.get('name'));
		});

		var str = 'Counties: ' + ftrNames.toString();
		str = str.replace(/,/g , ", ");

		$('#alertXY').text(str);	
	}

	function changeBasemap( layerName ) {
		var layers = map.getLayers();
		layers.forEach( function(layer) {
			if( layer.get('isBasemap') ) { 
				layer.set('visible', (  layer.get('myHandle') == layerName) );
			}
		});
	}
	function showHideLayer( layerName, checked ) {
		var layers = map.getLayers();
		layers.forEach( function(layer) {
			if( layer.get('myHandle') == layerName ) { 
				layer.set('visible', checked );
			}
		});
	}
	function showHideCarbonLayer( layerName, checked ) {
		var layers = map.getLayers();
		layers.forEach( function(layer) {
		    var handle = layer.get('myHandle'); 
			if( !handle || handle.indexOf('carbonLayer_') == -1 ) { return }
			if( layer.get('myHandle') == layerName ) { 
				layer.set('visible', checked );
			} else {
				layer.set('visible', !checked );
            } 
		});
	}

	var zoomingForCounties = false;
	function startCounties(val) {

		if(map.getView().getZoom()<7) {
			map.getView().setZoom(8);
			zoomingForCounties = true;
		} else {
			$('#wizCounties').modal('show');
		}
	}
	function zoomToCountyLevel() {
		if(map.getView().getZoom()<7) {
			map.getView().setZoom(8);
		}
	}

	var osmLayer;

	function init() {
		countiesLoading = true;
		//console.log('map init');
		var compiledTemplate;
		compiledTemplate = _.template(template_mapLayers);

		$('#mapLayersModal').remove();
		$('body').append(_.template(compiledTemplate()));
		
		var GotoControl = function(opt_options) {
			var options = opt_options || {};
			var element = document.getElementById('gotoControl');
			var this_ = this;

			var gotoBtn = $(element).find('button')[0];
			$(gotoBtn).on('click', function() {
							gotoUserLocation();
					});

			ol.control.Control.call(this, { 		
			 		element: element,
			 		target: options.target
			 	})
		};

		ol.inherits(GotoControl, ol.control.Control);
		/*
 *      var MapLayersControl = function(opt_options) {
			var options = opt_options || {};
			var element = document.getElementById('mapLayersControl');
			var this_ = this;

			var mapLayersButton = $(element).find('button')[0];
			$(mapLayersButton).on('click', function() {
				showMapLayersModal();
			});

			ol.control.Control.call(this, { 		
			 		element: element,
			 		target: options.target
			 	})
		 };

		 ol.inherits(MapLayersControl, ol.control.Control);
*/
		var bingLayer = new ol.layer.Tile({
		    visible: false,
		    isBasemap: true,		//added custom param
		    myHandle: 'bingLayer',  //added custom param, handle for manip
		    preload: Infinity,
		    source: new ol.source.BingMaps({
                      key: 'Aqdn0paITKMdeB_alpxj4U9yK2le9_OQJqtUqmxs7x28-zN_vfbC6r3ZssTdWQNV',
		      imagerySet: 'AerialWithLabels'
		      // use maxZoom 19 to see stretched tiles instead of the BingMaps
		      // "no photos at this zoom level" tiles
		      // maxZoom: 19
		    })
		 });
		
		var mapquestLayer = new ol.layer.Tile({
			visible: false,
	        source: new ol.source.MapQuest({layer: 'sat'}),
	        myHandle: 'mapQuestLayer',
	        isBasemap: true,
	    });

	    osmLayer = new ol.layer.Tile({
			visible: true,
			source: new ol.source.OSM(),
			myHandle: 'osmLayer',
			isBasemap: true,
            crossOrigin: 'anonymous',
		});

		vsStrategyBbox = new ol.source.ServerVector({
		        format: new ol.format.GeoJSON(),
		        loader: loaderFunction,
		        strategy: ol.loadingstrategy.bbox,
		    });
		countyLayer = new ol.layer.Vector({
		    	isBasemap: false,
		        myHandle: 'countyLayer',
		        source: vsStrategyBbox,
		        style: new ol.style.Style({
		            stroke: new ol.style.Stroke({
						color: [153,153,0, 0.75],
						width: 3
		            })
		        }),
		        minResolution: 100,
				maxResolution: 2200
		    });

		stateLayer	= new ol.layer.Vector({
				title: 'States',
				isBasemap: false,
				visible: true,
				myHandle: 'stateLayer',
				source: new ol.source.GeoJSON({
					url: 'js/datafiles/statesEsri.json',
					projection: "EPSG:3857",
				}),
				style: new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: [255, 255, 255, 0.60],
						width: 2
					}),
					minResolution: 500,
					maxResolution: 25000,
					selectable: false
				}),
			});


		carbonLayer_ag = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_ag',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_ag_mg_ha1_colors_NEW',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_bg = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_bg',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_bg_mg_ha',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_dd = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_dd',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_dd_mg_ha',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_lt = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_lt',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_lt_mg_ha',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_sd = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_sd',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_sd_mg_ha',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_so = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_so',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_so_mg_ha',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_us = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_us',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:carbon_us_mg_ha',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
		carbonLayer_TOTAL = new ol.layer.Tile({
		        visible: false,
		        isBasemap: false,
		        myHandle: 'carbonLayer_TOTAL',
		        source: new ol.source.TileWMS({
		          url: FCA_APP.GEOSERVER+'wms',
		          params: {'FORMAT': format, 
		                'VERSION': '1.1.1',
		                tiled: true,
		                LAYERS: 'ForestCarbon:c_to_overview',
		                STYLES: '',
		          },
                    crossOrigin: 'anonymous',
		        })
			});
 		map = new ol.Map({
			target: 'map',
			visible: false,
			interactions: new ol.interaction.defaults(
					{dragPan:false, //so we can add our own
					altShiftDragRotate:false, 
					pinchRotate:false} 
				), 
			//resolutions: [10, 5, 1],
			layers: [
				osmLayer,
				mapquestLayer,
				bingLayer,
				
				carbonLayer_TOTAL,
				carbonLayer_ag,
				carbonLayer_bg,
				carbonLayer_dd,
				carbonLayer_lt,
				carbonLayer_sd,
				carbonLayer_so,
				carbonLayer_us,
				countyLayer,
				stateLayer,
			],

			view: new ol.View({
				//from epsg lon/lat, to sph merc, which the map is in
				center: ol.proj.transform([-98,37], 'EPSG:4326', 'EPSG:3857'),
				zoom: 5,
				extent: [-17586848, 1865930, -5317788, 6894875],
				minZoom: 4,
				maxZoom: 16
			}),
			controls: ol.control.defaults({

			}).extend([
				//new GotoControl()
			]).extend([
				//new MapLayersControl()
			])

		});
		
		map.on('singleclick', function(event) {

			var mapPoint = event.coordinate;

			var ev = jQuery.Event( "Map:singleClick", {mapPoint:mapPoint});
			$('body').trigger(ev)
		});

		$('#chooseLayer').change(function() {
			var style = $(this).find(':selected').val();
			var i;
			var layers = map.getLayers();
			layers.forEach( function(layer) {
				layer.set('visible', (layer.get('style') == style));
			});
		});

	 	// button.addEventListener('click', handleRotateNorth, false);
		// button.addEventListener('touchstart', handleRotateNorth, false);

		map.addControl(new ol.control.ZoomSlider());

		var v = map.getView();
		v.on('change:resolution', function(event) {
			//console.log('');debugger;
		});
		map.on('moveend', function(event) {
			if( v.getResolution() < 2200 ) {
				$('#btnDragSelect').prop('disabled',false);
			} else {
				$('#btnDragSelect').prop('disabled',true);
			};
			if(zoomingForCounties) {
				zoomingForCounties = false;
				if( countiesLoading ) {
					var intervalId = setInterval(delayShow, 250);

					function delayShow(){
						//console.log('waiting...');
						if( !countiesLoading ) {
							$('#wizCounties').modal('show');
							clearInterval(intervalId);
						}
					}
				}
			}

		});

		selectStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: [150, 100, 100, 0.75],
				width: 3
			}),
			fill: new ol.style.Fill({
				color: 'rgba(0,0,255,0.3)'
			})
		});

	    //select interaction so statesLayer not selectable
	    // TODO - not working, might be ol bug
		selectInteraction = new ol.interaction.Select({
			layers: function(layer) {
				return ((layer !== stateLayer) && (dragSelectingState));
			},		            
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: [100, 200, 100, 0.75],
					width: 4
				}),
				fill: new ol.style.Fill({
					color: 'rgba(255,0,255,0.3)'
				})
			})
		});

		selectInteraction.on('select', function(evt) {
			if( dragSelectingState ) {
				var feature = evt.selected[0]; 
				addToDragFeatures(feature);
			}
		});
		
		dragPanInteraction = new ol.interaction.DragPan();
		
		dragStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: [100, 200, 100, 0.75],
				width: 4
			}),
			fill: new ol.style.Fill({
				color: 'rgba(255,0,255,0.3)'
			})
		});
		
		testStyle = new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: [100, 120, 100, 0.25],
				width: 2
			}),
			fill: new ol.style.Fill({
				color: 'rgba(0,0,200,0.3)'
			})
		});

		customPointer = new ol.interaction.Pointer({
				handleUpEvent: pUp,
				handleDownEvent: pDown,
				handleDragEvent: pDrag,
				handleMoveEvent: pMove,
		});

		map.addInteraction(customPointer);
		map.addInteraction(dragPanInteraction);
		map.addInteraction(selectInteraction);
		
		customPointer.setActive(false);
		//could use pointerdrag, also experimental
		map.on('pointermove', function(event) {
			isDragging = event.dragging;
			if( event.dragging && dragSelectingState) {
				map.forEachFeatureAtPixel(event.pixel, function(feature) {
					var testForCounty = feature.get('agsum');
					if( testForCounty ) {
						addToDragFeatures(feature);
					}
				});
			}
		});
		//zoom to us
		// /var countryExtent = [-15586848, 1865930, -5317788, 6894875];
		//map.getView().fitExtent(countryExtent, map.getSize());
	}


	return {
		init: 							init,
		clearMap: 						clearMap,
		showLayer: 						showLayer,
		map: 							map,
		setMapPoint: 					setMapPoint,
		drawRadius: 					drawRadius,
		gotoUserLocation: 				gotoUserLocation,
		getUserLocation: 				getUserLocation,
		countyFeaturesUpdated: 			countyFeaturesUpdated,
		getCountyFeaturesById: 			getCountyFeaturesById,
		loadCountiesFromLocalStorage: 	loadCountiesFromLocalStorage, 
		showHideLayer: 					showHideLayer,
		showHideCarbonLayer: 			showHideCarbonLayer,
		changeBasemap: 					changeBasemap,
		startCounties: 					startCounties,
		zoomToCountyLevel: 				zoomToCountyLevel
		
	};
});
