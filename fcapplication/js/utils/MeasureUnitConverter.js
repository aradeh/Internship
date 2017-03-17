define([],function() {

	var appPreferences = {};
	var self;

	function test(outcome, msg) {
		var output = outcome ? 'TRUE : '+msg : 'FALSE : '+msg;
		console.log(output);
	}

	function runTests() {
		test(kmToMiles(1)==.62, 'testing kmToMiles');
		test(milesToKm(1)==1.61, 'testing milesToKm');
		test(haToMiles(10)==.038, 'testing milesToKm');
		test(metricTonsToTons(1)==1.10, 'testing metricTonsToTons');
		test(tonsToMetricTons(1)==.91, 'testing tonsToMetricTons');
	}

	function kmToMiles(km) {
		return (km*.621371).toFixed(2);
	};

	function haToMiles(ha) {
		return (ha*0.003861).toFixed(2);
	};

	function haToAcres(ha) {
		return (ha*2.47105).toFixed(2);
	};

	function acresToHa(ac) {
		return (ac*.404686).toFixed(2);
	};

	function milesToKm(miles) {
		return (miles*1.60934).toFixed(2);
	};

	function metricTonsToTons(metricTons) {
		return (metricTons*1.10231).toFixed(2);
	};

	function tonsToMetricTons(tons) {
		return (tons*.90718474).toFixed(2);
	};

	return {
		kmToMiles: 			kmToMiles,
		milesToKm: 			milesToKm,
		haToMiles:			haToMiles, 
		metricTonsToTons: 	metricTonsToTons,
		tonsToMetricTons: 	tonsToMetricTons,
		runTests: 			runTests,
		haToAcres: 			haToAcres
	};

});
