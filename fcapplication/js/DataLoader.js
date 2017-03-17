/* 
DataLoader makes the actual calls to the datasource - on or offline
*/
define([],function() {

    var url_radius = FCA_APP.SERVER+'fcapi/radius/';

	var dataSets = [];

	var isOnline = true;

	/* --- test data --- */ 
	function populateOfflineMockStorage() {
		var key, val;
		key = 'County-Jefferson';
		val = '{"name":"Jefferson","type":"County","carbonData":{"livingTrees":5,"deadWood":5,"standingDead":5,"soil":5,"leafLitter":5,"understory":5,"belowground":5}}';
		localStorage.setItem(key, val);
		key = 'County-Adams';
		val = '{"name":"Adams","type":"County","carbonData":{"livingTrees":2,"deadWood":2,"standingDead":2,"soil":2,"leafLitter":2,"understory":2,"belowground":2}}';
		localStorage.setItem(key, val);
		key = 'Watershed-Cherry Creek';
		val = '{"name":"Cherry Creek","type":"Watershed","carbonData":{"livingTrees":5,"deadWood":5,"standingDead":5,"soil":5,"leafLitter":5,"understory":5,"belowground":5}}';
		localStorage.setItem(key, val);
		key = 'WaterShed-Platte';
		val = '{"name":"Platte","type":"Watershed","carbonData":{"livingTrees":2,"deadWood":2,"standingDead":2,"soil":2,"leafLitter":2,"understory":2,"belowground":2}}';
		localStorage.setItem(key, val);
	}
	
	// TODO - add asserts, etc
	function testGetDataOffline() {

		populateOfflineMockStorage();

		var requests = [];
		var request = {};
		
		request.regionType = 'County';
		request.regionName = 'Jefferson';
		requests.push(request);
		var request2 = {};
		request2.regionType = 'County';
		request2.regionName = 'Adams';
		requests.push(request2);
		
		return getDataOffline(requests);
	}

	// param: requests =  County, Watershed, or Radius
	function testGetDataOnlineMock(requests) {
		var results = [];

		switch( requests ) {
			case 'County':
				results = ['{"type":"County","name":"Adams","carbonData":{"livingTrees":2,"deadWood":2,"standingDead":2,"soil":2,"leafLitter":2,"understory":2,"belowground":2}}','{"type":"County","name":"Jefferson","carbonData":{"livingTrees":5,"deadWood":5,"standingDead":5,"soil":5,"leafLitter":5,"understory":5,"belowground":5}}'];
				break;
			case 'Watershed':
				results = ['{"type":"Watershed","name":"Lower_Minnesota","carbonData":{"livingTrees":3,"standingDead":2,"deadWood":3,"soil":3,"leafLitter":3,"understory":3,"belowground":3}}','{"type":"Watershed","name":"Twin_Cities","carbonData":{"livingTrees":5,"deadWood":5,"standingDead":5,"soil":5,"leafLitter":5,"understory":5,"belowground":5}}'];
				break;
			case 'Radius':
				results = ['{"type":"Radius","name":"100km","units":"km","radius":100,"carbonData":{"livingTrees":1,"deadWood":2,"standingDead":2,"soil":3,"leafLitter":5,"understory":7,"belowground":11}}'];
				break;
		}
		
		return results;
	}


	/*	gets data from localStorage

		param: requests [] - array contains objs with counties, watershed,
			 or whatever region
		
		[{type:regionType, name:regionName},...]

		- localStorage keys are stored as 'regionType-regionName'
	*/
	function getDataOffline(requests, callback) {

		if(typeof(Storage) === 'undefined') {
			//TODO log error
			return;
		}

		var results = [];

		_.each(requests, function(request){
			'{"name":"Adams","type":"County","carbonData":{"livingTrees":2,"deadWood":2,"standingDead":2,"soil":2,"leafLitter":2,"understory":2,"belowground":2}}';

			//results.push( localStorage.getItem(request.regionType+'-'+request.regionName); );
			var rslt = localStorage.getItem(request.regionType+'-'+request.regionName); 
			if( rslt ) { 
				results.push(rslt); 
			}
		});

		return results;

	}

	/*	requests radius data from server

		[{type:regionType, name:regionName},...] 
		or [{type:'Radius', center:[x,y], length:val, unit:val, }...]

	*/
	function getDataOnline(requests, callback) {

		var results = [];

		var r = requests[0];

		if( r.type == 'Radius' ) {

		}
		var url= url_radius 
				+r.radius
				+'/'
				+r.centerPoint[0]
				+'/'
				+r.centerPoint[1];
		
		//REST - :radius/:lon/:lat
		$.ajax({
			method:'GET',
			url:url
		}).done(function( data ) {
			//console.log('DataLoader: getDataOnline returned');
			callback([data]);
		}).fail(function( msg ) {
			console.log('DataLoader: getDataOnline FAILED' + msg);
		});
	}

	function getData(requests, callback) {
		if(isOnline) {
			getDataOnline(requests, callback);
		} else {
			getDataOffline(requests, callback);
		}	
	};

	function setIsOnline(state) {
		isOnline = state;
	}

	function init(requests) {
		//console.log('setup DataLoader...');
	};

	return {
		init: init,
		setIsOnline: setIsOnline,
		getData: getData,
		testGetDataOffline: testGetDataOffline,
		testGetDataOnlineMock: testGetDataOnlineMock
	};
	
});
