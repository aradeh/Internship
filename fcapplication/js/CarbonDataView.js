/* Creates UI for given carbon data results
*/
define(['chart','utils/NumberFormatter','utils/MeasureUnitConverter','text!templates/CarbonDataView.html', 
	'text!templates/CarbonDataViewDataSet.html','text!templates/CarbonDataViewEquivalents.html',
	'text!templates/CarbonDataViewValue.html',
	'text!templates/CarbonDataPrintView.html',
	'text!templates/CarbonDataPrintViewDataSet.html',
	'text!templates/CarbonDataPrintViewValue.html',
	'text!templates/CarbonDataPrintViewEquivalents.html'],
	function(Chart,numberFormatter,unitConverter,template,templateDataSet,templateEquivs,templateValue, printTemplate, templateDataSetPrint, templateValuePrint, templateEquivsPrint) {

	//console.log('cdataview');

	var carbonData = [];
	var carbonDataFormatted = [];
	var totalsDataSet;

	
	function showChart(dataset) {

		// -- charts
		var chartData = [
		    {
		        value: parseInt(dataset.dataVals.livingTrees.replace(/\,/g, ''), 10),
		        color:"#56B95C",
		        highlight: "#CCCC00",
		        label: "Living Trees"
		    },
	    	{
		        value: parseInt(dataset.dataVals.standingDead.replace(/\,/g, ''), 10),
		        color: "#521D12",
		        highlight: "#CCCC00",
		        label: "Standing Dead"
		    },
		    {
		        value: parseInt(dataset.dataVals.deadWood.replace(/\,/g, ''), 10),
		        color: "#961514",
		        highlight: "#CCCC00",
		        label: "Deadwood"
		    },
		    {
		        value: parseInt(dataset.dataVals.soil.replace(/\,/g, ''), 10),
		        color: "#382016",
		        highlight: "#CCCC00",
		        label: "Soil"
		    },
		    {
		        value: parseInt(dataset.dataVals.leafLitter.replace(/\,/g, ''), 10),
		        color:"#E0B249",
		        highlight: "#CCCC00",
		        label: "Leaf Litter"
		    },
		    {
		        value: parseInt(dataset.dataVals.understory.replace(/\,/g, ''), 10),
		        color: "#6F7F32",
		        highlight: "#CCCC00",
		        label: "Understory"
		    },
		    {
		        value: parseInt(dataset.dataVals.belowground.replace(/\,/g, ''), 10),
		        color: "#326E36",
		        highlight: "#CCCC00",
		        label: "Belowground"
		    }
		];
		var chartOptions = {
		    segmentShowStroke : true,
		    segmentStrokeColor : "#fff",
		    segmentStrokeWidth : 2,
		    percentageInnerCutout : 50, // This is 0 for Pie charts
		    animationSteps : 100,
		    //animationEasing : "easeOutBounce",
		    animateRotate : false,
		    animateScale : false,
		    tooltipTemplate: function(valueObj) {
            	return valueObj.label + ': ' + numberFormatter.addCommas(valueObj.value);
			},
		    legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span style=\"background-color:<%=segments[i].fillColor%>\"></span><%if(segments[i].label){%><%segments[i].label%><%}%></li><%}%></ul>",
	
		};
		var selector = '#pieChart' + (dataset.geoid || '');
		var ctx = $(selector).get(0).getContext("2d");
		var pieChart = new Chart(ctx).Doughnut(chartData,chartOptions);

	};

	function reset() {
		$('#carbonResultsMdl').remove();
	};

	// expects datasets array, with totals as first item
	function formatDataSets( dataSets ) {

		totalsDataSet = dataSets[0];

		totalsDataSet.carbonPrice =  '$'+numberFormatter.addCommas(totalsDataSet.carbonPrice);
		totalsDataSet.carbonMarketPrice =  '$'+numberFormatter.addCommas(totalsDataSet.carbonMarketPrice);

		totalsDataSet.equivs.oilBarrels = numberFormatter.addCommas(totalsDataSet.equivs.oilBarrels);
		totalsDataSet.equivs.coalTrainCars = numberFormatter.addCommas(totalsDataSet.equivs.coalTrainCars);
		totalsDataSet.equivs.windTurbines = numberFormatter.addCommas(totalsDataSet.equivs.windTurbines);
		totalsDataSet.equivs.gasGallons = numberFormatter.addCommas(totalsDataSet.equivs.gasGallons);
		totalsDataSet.equivs.homes = numberFormatter.addCommas(totalsDataSet.equivs.homes);
		totalsDataSet.equivs.carEmmisions = numberFormatter.addCommas(totalsDataSet.equivs.carEmmisions);

		//console.log('setup CarbonDataView...');
		$.each(dataSets, function(idx1,dataSet){
			$.each(dataSet.dataVals, function(idx2,val){
				dataSet.dataVals[idx2] = numberFormatter.addCommas(val);
			});
			dataSet.areaac =  parseInt(dataSet.areaac);
			dataSet.areaha =  parseInt(dataSet.areaha);
			dataSet.areaac = numberFormatter.addCommas(dataSet.areaac);
			dataSet.areaha = numberFormatter.addCommas(dataSet.areaha);

			dataSet.grandTotal = numberFormatter.addCommas(dataSet.grandTotal);
		});
	} 
	
	// expects datasets array, with totals as first item
	function convertDataSetsToUS( dataSets ) {

		$.each(dataSets, function(idx1,dataSet){
			$.each(dataSet.dataVals, function(idx2,val){
				dataSet.dataVals[idx2] = unitConverter.metricTonsToTons(val);
			});
			dataSet.grandTotal = unitConverter.metricTonsToTons(dataSet.grandTotal);
			dataSet.areaac = unitConverter.haToAcres(dataSet.areaha);
			dataSet.measureSystem = 'US';
		});
	} 

	// measureSystem == US or METRIC
	function render( measureSystem ) {
		measureSystem = measureSystem.toUpperCase();//'METRIC';

		//deep copy of carbon data
	    carbonDataFormatted = JSON.parse(JSON.stringify(carbonData));

		//measureSystem = 'US';
		if( measureSystem == 'US' ){
			convertDataSetsToUS(carbonDataFormatted);
		}

		if( carbonDataFormatted[0].type != 'Totals' ) {
			carbonDataFormatted = carbonDataFormatted.reverse();
		}
		
		formatDataSets( carbonDataFormatted );

		totalsDataSet.measureSystem = measureSystem; 

		$('#carbonResultsMdl').remove();

		var compiledTemplate;

		compiledTemplate = _.template(template);
		$('body').append( compiledTemplate(totalsDataSet) );


		$.each(carbonDataFormatted, function(idx,dataSet){
			if( dataSet.type == 'Radius') {
				return;
			}
			if( carbonDataFormatted.length == 2 && dataSet.type == 'County') {
				return;
			}
			var compiledTemplate = _.template(templateDataSet);
			$('#carbonData').append( compiledTemplate(dataSet) );
		});
		compiledTemplate = _.template(templateEquivs);
		$('#equivalents').empty();
		$('#equivalents').append( compiledTemplate(totalsDataSet) );

		compiledTemplate = _.template(templateValue);
		$('#monetaryValue').empty();
		$('#monetaryValue').append( compiledTemplate(totalsDataSet) );

		$('#carbonResultsMdl').on('shown.bs.modal', function(e) {
			appendPrintListener();
			$('#carbonResultsMdl [data-toggle="tooltip"]').tooltip(); 
		});
		
		$('#carbonResultsMdl').on('hidden.bs.modal', function(e) {
			var ev = jQuery.Event( "CarbonDataView:closed" );
			$('body').trigger(ev);
		});

		$('#carbonResultsMdl').modal('show');

		
		function appendPrintListener() {
			$('#carbonResultsMdl .printBtn').click(function(){		
				
                var compiledTemplate;
		        //$('#carbonResultsMdl').remove();
                
                compiledTemplate = _.template(printTemplate);
                $('body').append( compiledTemplate(totalsDataSet) );
                
                $.each(carbonDataFormatted, function(idx,dataSet){
                    if( dataSet.type == 'Radius') {
                        return;
                    }
                    if( carbonDataFormatted.length == 2 && dataSet.type == 'County') {
                        return;
                    }
                    var compiledTemplate = _.template(templateDataSetPrint);
                    $('#carbonDataPrint').append( compiledTemplate(dataSet) );
                });
                compiledTemplate = _.template(templateEquivsPrint);
                $('#equivalentsPrint').append( compiledTemplate(totalsDataSet) );
                compiledTemplate = _.template(templateValuePrint);
                $('#monetaryValuePrint').append( compiledTemplate(totalsDataSet) );
                
                var pngImg = document.getElementById('printPngImg');
				var cvs = $('#map canvas');
				cvs = cvs[0];
				var img = new Image();
				img.setAttribute('crossOrigin', 'anonymous');

				console.log('copying image for print...');
				img = cvs.toDataURL('image/png');

				pngImg.src = img;
				pngImg.setAttribute('crossOrigin', 'anonymous');
				
				window.print();
                $('#cdpv .printBtnNew').on('click', function(e) {
                    $('#cdpv').remove();
                });
                $('#cdpv button.close').on('click', function(e) {
                    $('#cdpv').remove();
                });
		        //$('#cdpv').remove();

                /*
                var pngDiv = document.getElementById('printPng');
				var pngImg = document.getElementById('printPngImg');
				var cvs = $('#map canvas');
				cvs = cvs[0];
				var img = new Image();
				img.setAttribute('crossOrigin', 'anonymous');

				console.log('copying image for print...');
				img = cvs.toDataURL('image/png');

				//pngDiv.innerHTML = img;
				pngImg.src = img;
				
				window.print();

				console.log('complete image copy...');
				$('#printPngImg').empty();
			    */
				/*
                var win = window.open('','printWindow','fullscreen=yes');

				var compiledTemplate = _.template(templatePrint);
				$(win.document.body).append( compiledTemplate() );
                */
            });
		}

		showChart(totalsDataSet);

		$.each(carbonDataFormatted, function(idx,dataSet){
			showChart(dataSet);
		});

		//tab events
		$('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
			if( e.target.text=='Charts' ) {

			}
			else if( e.target.text=='Equivs' ) {

			}
		});
	};

	//pass in some data for the view
	function init(dataSets) {

		carbonData = dataSets;
		
	}

	return {
		init: init,
		render: render,
	};
	
});
