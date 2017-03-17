/* 
CarbonData holds all carbon data results from call to server or localhost
- it contains, and retrieves data from, the DataLoader

from epa.gov energy resources calculator

*/
define(['DataLoader'],function() {

	//console.log('cdata');

	var dataLoader = require('DataLoader');
	dataLoader.init();
	
	var measureSystem = 'metric';
	var carbonUnits = 'metric tons';

	// metadata -----

	//metadata is either this, or below
	var radiusLength = '0';
	var radiusCenter = [0,0];
	var units = 'miles';

	var requestArea = 0;

	//TODO - set in settings
	var carbonPrice = 139.33;
	var carbonMarketPrice = 3.70;

	//or this
	var counties = ['Denver'];

	//or this
	var watersheds = ['Upper South Platte - 10190002'];

	//------------

	//container for all datasets loaded of any type
	var dataSets = [];
	var totalsDataSet;

	/* --- test data ---*/
	var testDsWs1 = new BaseDataSet('Watershed','ws1',
		{
			livingTrees: 1,
			deadWood: 1,
			standingDead: 1,
			soil: 1,
			leafLitter: 1,
			understory: 1,
			belowground: 1
		}		
	);
	var testDsWs2 = new BaseDataSet('Watershed','ws2',
		{
			livingTrees: 2,
			deadWood: 2,
			standingDead: 2,
			soil: 2,
			leafLitter: 2,
			understory: 2,
			belowground: 2
		}		
	);
	
	function testLoadCarbonData(requests) {
		dataSets = [];

		//temp = requests is County, WS, or Radius

		//var results = dataLoader.testGetDataOnlineMock(requests);
		var results = dataLoader.testGetDataOffline(requests);
		parsedResults = [];
		// TODO - want this returned as json array from dataLoader, not array of json obs
		$.each( results, function(key,result) {	
			parsedResults.push(JSON.parse(result));
		});

		// if(!Array.isArray(parsedResults)){
		// 	parsedResults = [parsedResults];
		// }

		$.each( parsedResults, function(key,result) {	
			dataSets.push(new BaseDataSet(result.type, result.name, result.carbonData));
		});
		calcTotals();
	}

	// add asserts etc
	function testCalcTotals() {
		console.log('testCalcTotals...');
		
		//clear datasets, total and calc
		dataSets = [];
		dataSets.push(testDsWs1);
		dataSets.push(testDsWs2);
		calcTotals();
	} 

	// add asserts etc
	function testDataLoaderOffline() {
		console.log('testDataLoaderOffline...');
		//clear datasets, total and calc
		dataSets = [];
		dataSets.push(testDsWs1);
		dataSets.push(testDsWs2);
		calcTotals();
	} 


	/* 	data set constructor
		candidate for backbone model
	 	params: name 		(eg county name)
				type 		'County'|'Watershed','Radius'
				dataVals 	eg dataVals.livingtrees:3...
				radiusData	radiusData.radiusLength, .units, .centerPoint  

				TODO - replace radius requestAreaHA with self.areaha
	*/
	function BaseDataSet(type, name, dataVals, radiusData, geoid, areaha, lon, lat) {
		var self = this;
		self.type = type; 
		self.name = name; 
		self.geoid = geoid || null; 
		self.areaha = areaha || 0; 
		self.areaha = self.areaha.toFixed(2);
		self.areaac = 0; 
		self.measureSystem = 'METRIC';
        if(lon && lat) {
	        self.lat = lat;
	        self.lon = lon;
        }	
		self.dataVals = {
			livingTrees: 0,
			deadWood: 0,
			standingDead: 2,
			soil: 0,
			leafLitter: 0,
			understory: 0,
			belowground: 0
		};

		if( type == 'Radius' ) {
			self.dataVals.livingTrees = 	(dataVals.livingTrees * requestAreaHA).toFixed(2);
			self.dataVals.deadWood = 		(dataVals.deadWood * requestAreaHA).toFixed(2);
			self.dataVals.standingDead = 	(dataVals.standingDead * requestAreaHA).toFixed(2);
			self.dataVals.soil = 			(dataVals.soil * requestAreaHA).toFixed(2);
			self.dataVals.leafLitter = 		(dataVals.leafLitter * requestAreaHA).toFixed(2);
			self.dataVals.understory = 		(dataVals.understory * requestAreaHA).toFixed(2);
			self.dataVals.belowground = 	(dataVals.belowground * requestAreaHA).toFixed(2);

		} else {
			self.dataVals.livingTrees = 	parseInt(dataVals.livingTrees,10);
			self.dataVals.deadWood = 		parseInt(dataVals.deadWood,10);
			self.dataVals.standingDead = 	parseInt(dataVals.standingDead,10);
			self.dataVals.soil =			parseInt(dataVals.soil,10);
			self.dataVals.leafLitter = 		parseInt(dataVals.leafLitter,10);
			self.dataVals.understory = 		parseInt(dataVals.understory,10);
			self.dataVals.belowground = 	parseInt(dataVals.belowground,10);
		}
			

		self.grandTotal = 0;
		$.each( self.dataVals, function(key, value) {
			self.grandTotal += parseInt(value,10);
		});		
		$.each( self.dataVals, function(key, value) {
			self.dataVals[key+'Percent'] = ((parseInt(value,10)/self.grandTotal)*100).toFixed(0);
		});		
		if( type == 'Radius' ) {
			self.dataVals.livingTreesArea = 	parseFloat(dataVals.livingTrees).toFixed(4);
			self.dataVals.deadWoodArea = 		parseFloat(dataVals.deadWood).toFixed(4);
			self.dataVals.standingDeadArea = 	parseFloat(dataVals.standingDead).toFixed(4);
			self.dataVals.soilArea = 			parseFloat(dataVals.soil).toFixed(4);
			self.dataVals.leafLitterArea = 		parseFloat(dataVals.leafLitter).toFixed(4);
			self.dataVals.understoryArea = 		parseFloat(dataVals.understory).toFixed(4);
			self.dataVals.belowgroundArea = 	parseFloat(dataVals.belowground).toFixed(4);
		} else {
			self.dataVals.livingTreesArea = 	(dataVals.livingTrees / self.areaha).toFixed(4);
			self.dataVals.deadWoodArea = 		(dataVals.deadWood / self.areaha).toFixed(4);
			self.dataVals.standingDeadArea = 	(dataVals.standingDead / self.areaha).toFixed(4);
			self.dataVals.soilArea =			(dataVals.soil / self.areaha).toFixed(4);
			self.dataVals.leafLitterArea = 		(dataVals.leafLitter / self.areaha).toFixed(4);
			self.dataVals.understoryArea = 		(dataVals.understory / self.areaha).toFixed(4);
			self.dataVals.belowgroundArea = 	(dataVals.belowground / self.areaha).toFixed(4);
		}
		return self;
	};

	//recalc and store grand total of carbon for dataset
	function reTotalDataSet(ds) {
		ds.grandTotal = 0;
		$.each( ds.dataVals, function(key, value) {
			ds.grandTotal += parseInt(value,10);
			ds.dataVals[key+'Area'] = (ds.dataVals[key] / ds.areaha).toFixed(4);
		});	
		$.each( ds.dataVals, function(key, value) {
			ds.dataVals[key+'Percent'] = ((ds.dataVals[key] / ds.grandTotal)*100).toFixed(2);
		});	
		
	}

	//calculate carbon equivalents and values
	function calcCarbonEquivs(dataset) {
		dataset.equivs = {};

		dataset.equivs.oilBarrels = (dataset.grandTotal * 8.5).toFixed(0); 		// barrels consumed, CO2 emissions from
		dataset.equivs.coalTrainCars = (dataset.grandTotal * .02).toFixed(0);	// railcars worth of coal burned, CO2 emissions from
		dataset.equivs.windTurbines = (dataset.grandTotal * .001).toFixed(1);	// turbines installed, CO2 emissions from
		dataset.equivs.gasGallons = (dataset.grandTotal).toFixed(0) * 413;		// gallons of gas consumed, CO2 emissions from
		dataset.equivs.homes = (dataset.grandTotal * .335).toFixed(0); 			// homes' energy use for one year, CO2 emissions from
		dataset.equivs.carEmmisions = (dataset.grandTotal * .772).toFixed(0); 	// cars, yearly greenhouse gas emissions from

		dataset.carbonPrice = (dataset.grandTotal * carbonPrice).toFixed(0);
		dataset.carbonMarketPrice = (dataset.grandTotal * carbonMarketPrice).toFixed(0);
	}

	// add data sets to populate and display
	//  params: setName, setType, setDataVals 
	// function addDataSet( type, name, dataVals, radiusData, geoid, areaha ) {
	// 	var dataSet = new BaseDataSet(type,name,dataVals,radiusData, geoid, areaha);
	// 	totalDataSet(dataSet);
	// 	dataSets.push(dataSet);
	// }

	//util method to calc totals and add as dataset 
	function calcTotals() {

		var dataSetTotals = new BaseDataSet('Totals','Total',
			{
				livingTrees: 0,
				deadWood: 0,
				standingDead: 0,
				soil: 0,
				leafLitter: 0,
				understory: 0,
				belowground: 0
			},
			null, null, 0
		);

        var areaType;
		$.each( dataSets, function(key,ds) {
			dataSetTotals.areaha =  parseInt(dataSetTotals.areaha) + parseInt(ds.areaha,10);
			$.each( ds.dataVals, function(key,value) {
                areaType = ds.type;
				if( isNaN(dataSetTotals.dataVals[key]) ) {
					dataSetTotals.dataVals[key] = 0;
				}
				dataSetTotals.dataVals[key] += parseInt(value,10);
			});			
            if(ds.lat && ds.lon) {
                var pt = ol.proj.transform([ds.lon,ds.lat], 'EPSG:3857', 'EPSG:4326');
                dataSetTotals.lat = pt[1].toFixed(0);
                dataSetTotals.lon = pt[0].toFixed(0);
            } 
		});

		dataSets.push(dataSetTotals);
		totalsDataSet = dataSetTotals;
		reTotalDataSet(totalsDataSet);
		//subTotalDataSets();
        totalsDataSet.areaType = areaType;

		calcCarbonEquivs(totalsDataSet);
	}

	function resetDataSets() {
		dataSets = [];
	}

	function getDataSets() {
		return dataSets;
	}
	function getTotalsDataSet() {
		return totalsDataSet;
	};

    // calc a total for each regular set, and get percents
    function subTotalDataSets() {

		$.each( dataSets, function(key, ds) {
            $.each( ds.dataVals, function(key, value) {
                ds.subTotal += parseInt(value,10);
            });	
            $.each( ds.dataVals, function(key, value) {
			    ds.dataVals[key+'Percent'] = ((value / ds.subTotal)*100).toFixed(2);
            });	
        });	
    }

	/* gets carbon data from features (?put in DataLoader, work with getOffline?)
	
	*/
	function getDataFromFeatures(features) {

		var results = [];
		var type = features.type;

		_.each(features.features, function(ftr) {
			var rslt = {};
			rslt.name = ftr.get('name');
			rslt.totsum = ftr.get('totsum');
			rslt.geoid = ftr.get('geoid');
			rslt.areaha = ftr.get('area_ha');
			console.log(rslt.name + ' ' + ftr.get('area_ha'));
			var carbonData = {};
			carbonData.deadWood = parseInt(ftr.get('ddsum'),10).toFixed(2);
			carbonData.standingDead = parseInt(ftr.get('sdsum'),10).toFixed(2);
			carbonData.belowground = parseInt(ftr.get('bgsum'),10).toFixed(2);
			carbonData.understory = parseInt(ftr.get('ussum'),10).toFixed(2);
			carbonData.livingTrees = parseInt(ftr.get('agsum'),10).toFixed(2);
			carbonData.leafLitter = parseInt(ftr.get('ltsum'),10).toFixed(2);
			carbonData.soil = parseInt(ftr.get('sosum'),10).toFixed(2);
			rslt.carbonData = carbonData;
			rslt.type = type;
			rslt.areaType = type;

			if( rslt ) { 
				results.push(rslt); 
			}
		});

		resetDataSets();

		$.each( results, function(key,result) {	
			dataSets.push(new BaseDataSet(result.type, result.name, result.carbonData, null, result.geoid, result.areaha));
		});

		calcTotals();
		var ev = jQuery.Event( "CarbonData:getDataFromFeatures" );
		$('body').trigger(ev);
	}

	//Loads carbon data into this module
	// - used only for Radius call now
	// - pass request to DataLoader, which will retrieve online or offline data
	// param: requests [] - array of data request fields 
	function loadCarbonData(requests) {
		$("#spinner").show();
		dataLoader.getData(requests, callback);

		function callback(results) {
			$("#spinner").hide();

			var r = requests[0].radius;
			var lon = requests[0].centerPoint[0];
			var lat = requests[0].centerPoint[1];
			requestArea = (r*r*3.14).toFixed(0);
			requestAreaHA = requestArea/10000; //hectares 
			requestAreaKM = requestArea/1000000; //km

			console.log('CarbonData - loadCarbonData - callback');	

			resetDataSets();
			parsedResults = [];
			// TODO - want this returned as json array from dataLoader, not array of json obs
			$.each( results, function(key,result) {	
				parsedResults.push(JSON.parse(result));
			});

			$.each( parsedResults, function(key,result) {	
				dataSets.push(new BaseDataSet(result.type, result.name, result.carbonData, result.radiusData, null, requestAreaHA, lon, lat));
			});
			calcTotals();
			var ev = jQuery.Event( "CarbonData:loadCarbonData" );
			$('body').trigger(ev);
		}
	}

	function init(options) {
		//console.log('setup CarbonData...');
	};

	return {
		init: init,
		testCalcTotals: testCalcTotals,
		loadCarbonData: loadCarbonData,
		testLoadCarbonData: testLoadCarbonData,
		getDataSets: getDataSets,
		getTotalsDataSet: getTotalsDataSet,
		getDataFromFeatures: getDataFromFeatures
	};
	
});
