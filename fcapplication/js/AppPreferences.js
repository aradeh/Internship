define([],function() {

	var appPreferences = {
		measureSystem: 		'Metric',
		measureUnits: 		'KM', 
		basemap: 			'osmLayer',
		countyVisible:		true,
		legendVisible:		false,
		statesVisible:		true,
		carbonLegendVisible:false,
		carbonLayerVisible: 	{
			carbonLayer_TOTAL: false,
            carbonLayer_ag: false,
			carbonLayer_bg: false,
			carbonLayer_dd: false,
			carbonLayer_lt: false,
			carbonLayer_sd: false,
			carbonLayer_so: false,
			carbonLayer_us: false,
			carbonLayer_OFF: true,
		},
        cLayer: 'OFF',
        //nitgeo@ip-172-31-13-170 js]$ vim ../css/forestcarbon.css
        //};
        ranges: {
                measureText: {
                    US: 'Carbon in Tons/ac',
                    Metric: 'Carbon in Mg/ha',
                },

                OFF : {
                    Metric: [
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                    ],
                    US: [
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                            { low:'', hi:'' },
                    ],
                },
                sd: {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'2' },
                            { low:'2', hi:'4' },
                            { low:'4', hi:'6' },
                            { low:'6', hi:'8' },
                            { low:'8', hi:'' },
                        ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'0.89' },
                            { low:'0.89', hi:'1.78' },
                            { low:'1.78', hi:'2.68' },
                            { low:'2.68', hi:'3.57' },
                            { low:' 3.57', hi:''  },
                        ]
                },
                ag : {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'20' },
                            { low:'20', hi:'40' },
                            { low:'40', hi:'60' },
                            { low:'60', hi:'80' },
                            { low:' 80', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'8.92' },
                            { low:'8.92', hi:'17.84' },
                            { low:'17.84', hi:'26.77' },
                            { low:'26.77', hi:'35.69' },
                            { low:' 35.69', hi:'' },
                    ]
                },
                bg : {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'5' },
                            { low:'5', hi:'10' },
                            { low:'10', hi:'15' },
                            { low:'15', hi:'20' },
                            { low:' 20', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'2.23' },
                            { low:'2.23', hi:'4.46' },
                            { low:'4.46', hi:'6.69' },
                            { low:'6.69', hi:'8.92' },
                            { low:' 8.92', hi:'' },
                    ]
                },
                dd : {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'3' },
                            { low:'3', hi:'6' },
                            { low:'6', hi:'9' },
                            { low:'9', hi:'12' },
                            { low:' 12', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'1.34' },
                            { low:'1.34', hi:'2.68' },
                            { low:'2.68', hi:'4.01' },
                            { low:'4.01', hi:'5.35' },
                            { low:' 5.35', hi:'' },
                    ]
                },
                lt : {//forest floor
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'7.5' },
                            { low:'7.5', hi:'15' },
                            { low:'15', hi:'22.5' },
                            { low:'22.5', hi:'30' },
                            { low:' 30', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'3.35' },
                            { low:'3.35', hi:'6.69' },
                            { low:'6.69', hi:'10.04' },
                            { low:'10.04', hi:'13.38' },
                            { low:'13.38', hi:'' },
                    ]
                },
                TOTAL: {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'50' },
                            { low:'50', hi:'100' },
                            { low:'100', hi:'150' },
                            { low:'150', hi:'200' },
                            { low:'200', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'22.30' },
                            { low:'22.30', hi:'44.61' },
                            { low:'44.61', hi:'66.91' },
                            { low:'61.99', hi:'89.22' },
                            { low:' 89.22', hi:'' },
                    ]
                },
                so : {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'20' },
                            { low:'20', hi:'40' },
                            { low:'40', hi:'60' },
                            { low:'60', hi:'80' },
                            { low:'80', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'8.92' },
                            { low:'8.92', hi:'17.84' },
                            { low:'17.84', hi:'26.77' },
                            { low:'26.77', hi:'35.69' },
                            { low:' 35.69', hi:'' },
                    ]
                },
                us : {
                    Metric: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'0.15' },
                            { low:'0.15', hi:'0.30' },
                            { low:'0.30', hi:'0.45' },
                            { low:'0.45', hi:'0.60' },
                            { low:'.60', hi:'' },
                    ],
                    US: [
                            { low:'no estimate', hi:'' },
                            { low:'', hi:'0.07' },
                            { low:'0.07', hi:'0.13' },
                            { low:'0.13', hi:'0.20' },
                            { low:'0.20', hi:'0.27' },
                            { low:'0.27', hi:'' },
                    ],
                },
            }
	};
	
	// getterSetters
	function basemap(value) {
        return value === undefined ? appPreferences.basemap : appPreferences.basemap = value;
    }
    function countyVisible(value) {
        return value === undefined ? appPreferences.countyVisible : appPreferences.countyVisible = value;
    }
    function statesVisible(value) {
        return value === undefined ? appPreferences.statesVisible : appPreferences.statesVisible = value;
    }
    function carbonLegendVisible(value) {
        return value === undefined ? appPreferences.carbonLegendVisible : appPreferences.carbonLegendVisible = value;
    }
    //straight setter
    function carbonLayerVisible(layerName, value) {
        appPreferences.carbonLayerVisible[layerName] = value;
        if( value ) {
            appPreferences.cLayer = layerName.substring(layerName.indexOf('_')+1);
        }
    }
    function legendVisible(value) {
        return value === undefined ? appPreferences.legendVisible : appPreferences.legendVisible = value;
    }
    

	function getMeasureSystem() {
		return appPreferences.measureSystem;
	}

	function setMeasureSystem(system) {
		if( system !== 'US' && system !== 'Metric' ) {
			console.log('inavlid measurement system :: ' + system);
			return;
		}
		appPreferences.measureSystem = system;
		if(appPreferences.measureSystem == 'US') {
			appPreferences.measureUnits = 'Miles';
		} else if (appPreferences.measureSystem == 'Metric') {
			appPreferences.measureUnits = 'KM';
		}
	}

	function getPrefs () {
		return appPreferences;
	}

	function logPrefs() {
		console.dir(appPreferences);
	}

	function init() {
		//setup wizard values, default options, etc.
		//console.log('setup AppPref...');

	};

	return {
		init: init,
		setMeasureSystem: 		setMeasureSystem,
		getMeasureSystem: 		getMeasureSystem,
		getPrefs: 				getPrefs,
		logPrefs: 				logPrefs,
		basemap: 				basemap, 
		carbonLayerVisible: 	carbonLayerVisible, 
		countyVisible: 			countyVisible,
		statesVisible: 			statesVisible,
		carbonLegendVisible: 	carbonLegendVisible
	};

});
