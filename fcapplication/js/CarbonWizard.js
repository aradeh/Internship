/*
CarbonWizard handles opening and submission of wizard dialogs, tracking where the 
 user is in the wizard process, and packaging the request in an object.
*/
define(['text!templates/WizRadius.html','text!templates/WizLocationMethod.html','text!templates/WizCounties.html','text!templates/WizWatersheds.html','text!datafiles/countyAndStateList.json'],
	function(template_wizRadius,template_wizLocationMethod,template_wizCounties,template_wizWatersheds,templateTextCountiesStates) {
	"use strict";
	var self;
	//temp 
	var states = ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
	var counties = [];
	var countiesJSON;

	var currentStates = [];
	var currentCounties = [];

	var isOnline;
	var isWaitingForMapPoint = false;

	var LocationTypes = {
		GPS : 'GPS',
		SelectFromMap: 'SelectFromMap',
		Counties: 'Counties',
		Watersheds: 'Watersheds'
	};

	var defaultOptions = {
		//locationType: 	self.LocationTypes.GPS, //can't use this enum yet
		locationType: 	'GPS', 
		radius: 		50,
		mapPoint:  		null, 
		counties: [],
		countyNames: [],
		watersheds: []
	};

	var dialogIds = ['wizLocationMethod','wizRadius','wizCounties'];

	//values chosen by user going through the wizard
	var chosenOptions = {
		locationType: 	null,
		radius: 		0,
		mapPoint:  		null,
		counties: 		[],
		countyNames: 	[],
		watersheds: 	[],
	}

	var interruptedFlag = false;

	var nextWiz = '';

	var isOnline = true;

	var currentStage = {};

	var wizardRunning = false;

	function cancelWiz() {
		chosenOptions.locationType = 	null;
		chosenOptions.radius = 			0;
		chosenOptions.mapPoint =  		null;
		chosenOptions.counties = 		[];
		chosenOptions.countyNames	=	[];
		chosenOptions.watersheds = 		[];

		isWaitingForMapPoint = false;
	}

	function setupHanlders() {

		$('#wizLocationMethod').on('show.bs.modal', function(e){
			wizardRunning = true;
		});

		$('#wizLocationMethodFrm').submit(function(e){
			e.preventDefault();

			var selected = $(this).find('input[name=locMethod]:checked').val();
			chosenOptions.locationType = LocationTypes[selected];

			$('#wizLocationMethod').modal('hide');


			if( chosenOptions.locationType == LocationTypes.SelectFromMap  ) {
				$('html,body').css('cursor','crosshair');
				nextWiz = 'wizRadius';
				self.isWaitingForMapPoint = true;
			} else if ( chosenOptions.locationType == LocationTypes.GPS ) {
				var ev = jQuery.Event( "wiz:wizLocationMethod:GPSSelected" );
				$('body').trigger(ev);
			} else if ( chosenOptions.locationType == LocationTypes.Counties ) {
				var ev = jQuery.Event( "wiz:wizLocationMethod:countySelected" );
				$('body').trigger(ev);
			} else if ( chosenOptions.locationType == LocationTypes.Watersheds ) {
				$('#wizWatersheds').modal('show');
			}

			var ev = jQuery.Event( "wiz:wizLocationMethod:closed" );
			$('body').trigger(ev);
			
		});

		$('#wizRadius').on('shown.bs.modal', function(e){
			self.isWaitingForMapPoint = false;
			$('html,body').css('cursor','default');
		});

		$('#wizRadiusFrm').submit( function(e) {
			e.preventDefault();

			var selected = $(this).find('input[name=radius]:checked').val();
			
			if( selected == 'other') {
				chosenOptions.radius = $(this).find('input[name=otherRadius]').val();
			} else {
				chosenOptions.radius = selected;
			}

			$('#wizRadius').modal('hide');

			var ev = jQuery.Event( "wiz:wizRadius:closed" );
			$('body').trigger(ev);
		});

		$('#wizCounties').on('shown.bs.modal', function(e){
			
			$('#selCounties').empty();
			$('#countiesSelected').empty();

			var stateSelect = $( "#selStates" );
			stateSelect.empty();
			$('<option>').val('').text('').appendTo(stateSelect);

			$.each(currentStates, function(name,value){
				$('<option>').val(value).text(value).appendTo(stateSelect);
			});

			chosenOptions.counties = [];
			chosenOptions.countyNames = [];

		});

		$('#wizCountiesFrm').submit( function(e){
			e.preventDefault();

			$('#wizCounties').modal('hide');

			var ev = jQuery.Event( "wiz:wizCounties:closed", {countyIds: chosenOptions.counties} );
			$('body').trigger(ev);

		});

		$('#selCounties').on('change', function(e){
			var selectedVal = $(this).val();
			var selected = $(this).find('option:selected').text();
			var selectedState= $( "#selStates option:selected" ).val();
		
			//$.each(selectedVal, function(idx,val) {
				if( chosenOptions.counties.indexOf(selectedVal) == -1 ) {
					chosenOptions.counties.push(selectedVal);
					chosenOptions.countyNames.push(selected + ', ' + selectedState);
				}
			//});
			$('#countiesSelected').empty();
			$('#countiesSelected').append(chosenOptions.countyNames.join('&#13;&#10;'));
		});

		$('#wizWatershedsFrm').submit( function(e){
			e.preventDefault();
			
			var selected = $(this).find('#selState').val();
			
			selected = $(this).find('#selWatersheds').val() || '';
			chosenOptions.watersheds = selected; 
			
			$('#wizWatersheds').modal('hide');

			var ev = jQuery.Event( "wiz:wizWatersheds:closed" );
			$('body').trigger(ev);

		});

		$('#selStates').change( function(e){
			//var selected = $(this).val();
			populateCountiesSelectLive()
		});

		$('#selCounties .close').on('click', function(e){
			cancelWizard();
		});

		$('#wizLocationMethod .close').on('click', function(e){
			cancelWiz();
		});
		
		$('#wizCounties .close').on('click', function(e){
			cancelWiz();
		});
		
		$('#wizRadius .close').on('click', function(e){
			cancelWiz();
		});

		/* back buttons */
		var goingBack = false;
		$('#wizRadius .wizBack').click(function(e){
			goingBack = true;
		});
		$('#wizRadius').on('hidden.bs.modal', function(e){
			if( goingBack ) { 
				goingBack = false; 
				$('#wizLocationMethod').modal('show');
			}
		});

		$('#wizCounties .wizBack').click(function(e){
			goingBack = true;
		});
		$('#wizCounties').on('hidden.bs.modal', function(e){
			if( goingBack ) { 
				goingBack = false; 
				$('#wizLocationMethod').modal('show');
			}
		});

		$('#wizWatersheds .wizBack').click(function(e){
			goingBack = true;
		});
		$('#wizWatersheds').on('hidden.bs.modal', function(e){
			if( goingBack ) { 
				goingBack = false; 
				$('#wizLocationMethod').modal('show');
			}
		});

		/* --- end back buttons */
	}

	//params: 
	//  measureSystem: 'metric' || 'us' 
	function startWiz(measureSystem) {
		wizardRunning = true;

		$('#wizLocationMethod').modal('show');
	};

	function wizShowRadiusDialog(measureSystem) {

		$('#wizRadius').modal('show');
		
	};

	//populate countyWiz selects from loaded features
	function populateStatesSelectLive( ) {
		var stateSelect = $( "#selStates" );

		$.each(currentStates, function(name,value){
			$('<option>').val(value).text(value).appendTo(stateSelect);
		});
	}

	function sortByCountyName(a, b){
  		var aName = a.County.toLowerCase();
  		var bName = b.County.toLowerCase(); 
  		return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
	}
	//called on change of form State select 
	function populateCountiesSelectLive() {
		var countySelect = $( "#selCounties" );
		countySelect.empty();

		var state = $( "#selStates option:selected" ).val();

		currentCounties.sort(sortByCountyName);
	
		$.each(currentCounties, function(idx,val){
			if(val.State == state) {
				$('<option>').val(val.geoid).text(val.County).appendTo(countySelect);
			}
		});
	}


	function populateWatershedsSelect() {
		
	}

	function getChosenOptions() {
		return chosenOptions;
	}

	function startWiz(isOnline) {
		$('#wizLocationMethod').modal('show');
	}

	function setMapPoint(pt) {
		chosenOptions.mapPoint = pt;
	}

	//param: countiesAndStates[]  - array of objs with format {State:'Colorado',County:'Jeffco'}
	function updateCounties(countiesAndStates) {
		currentStates = [];
		currentCounties = [];
		$.each(countiesAndStates, function(idx,val){
			currentCounties.push(val);
			if( currentStates.indexOf(val.State) == -1 ) {
				currentStates.push(val.State);
			}
		});
	}

	function init(appPrefValues) {
		self = this;
		self.appPrefValues = appPrefValues;

		self.appPrefValues.isOnline = true;
		self.isOnline = true;

		//console.log('setup CarbWiz...');

		var compiledTemplate;
		
		compiledTemplate = _.template(templateTextCountiesStates);
		countiesJSON = JSON.parse(compiledTemplate());

		$('#wizLocationMethod').remove();
		compiledTemplate = _.template(template_wizLocationMethod);
		$('body').append(_.template(compiledTemplate(appPrefValues)));

		$('#wizRadius').remove();
		compiledTemplate = _.template(template_wizRadius);
		$('body').append(_.template(compiledTemplate(appPrefValues)));

		$('#wizCounties').remove();
		compiledTemplate = _.template(template_wizCounties);
		$('body').append(_.template(compiledTemplate(appPrefValues)));

		$('#wizWatersheds').remove();
		compiledTemplate = _.template(template_wizWatersheds);
		$('body').append(_.template(compiledTemplate(appPrefValues)));

		setupHanlders();

	}

	return {
		init: init,
		cancelWiz: cancelWiz,
		startWiz: startWiz,
		isWaitingForMapPoint: isWaitingForMapPoint,
		setMapPoint: setMapPoint,
		getChosenOptions: getChosenOptions,
		updateCounties: updateCounties
	};
});
