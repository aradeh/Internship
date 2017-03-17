//AppreferencesView - presently, most settings are controled by the form,
// and not stored in the AppPreferences.js model
define(['text!templates/AppPreferencesView.html'],function(template) {

	var appPreferences = {};
	var self;

	function setupHandlers() {
		
		$('#appPreferencesForm input[name=measureSystem]').change(function(e){
			var selected = $(this).val();
			self.appPreferences.setMeasureSystem( selected );
			var ev = jQuery.Event( "appPreferencesView:setMeasureSystem");
			$('body').trigger(ev);
		});

		$("#appPreferencesForm input[name='basemap']").change(function(e){
			var layerName = $(this).val();
			self.appPreferences.basemap( layerName );

			var ev = jQuery.Event( "appPreferencesView:changeBasemap", {layerName:layerName} );
			$('body').trigger(ev);

		});

		//$("#appPreferencesForm .shCarbon").on('click',function(e){
		$("#appPreferencesForm input:radio[name=shCarbonLayer]").on('change',function(e){
            //var checked = $(this).find('input[name=shCarbonLayer]:checked');
            var checked = $(this).prop('checked');
			var layerName = $(this).val();
		    if( layerName != 'carbonLayer_OFF' ) {
                self.appPreferences.carbonLayerVisible( 'carbonLayer_OFF', false );
            }
		    self.appPreferences.carbonLayerVisible( layerName, checked );

            /*
            $("#appPreferencesForm input[name=shCarbonLayer][type=radio]").each( function(idx){
                if( $(this).val() === layerName ) { 
                    $(this).parent().addClass('active');
                    return; 
                }
                $(this).prop('checked', false);
                this.checked = false;
            });
            */
			var ev = jQuery.Event( "appPreferencesView:showHideCarbonLayer", {checked:checked,layerName:layerName} );
			$('body').trigger(ev);
		});

		$("#appPreferencesForm input[name=shLayer][type=checkbox]").on('click',function(e){
			var checked = $(this).prop('checked');
			var layerName = $(this).val();
			if(layerName == 'stateLayer') {
				self.appPreferences.statesVisible( checked );
			} else if(layerName == 'countyLayer') {
				self.appPreferences.countyVisible( checked );
			} 

			var ev = jQuery.Event( "appPreferencesView:showHideLayer", {checked:checked,layerName:layerName} );
			$('body').trigger(ev);
		});

		$("#appPreferencesForm input[name=shLegend][type=checkbox]").on('click',function(e){
			var checked = $(this).prop('checked');
			self.appPreferences.carbonLegendVisible( checked );

			var ev = jQuery.Event( "appPreferencesView:showHideLegend", {checked:checked} );
			$('body').trigger(ev);
		});
	}

	function render(options) {
		
        //$('#appPreferencesModal').remove();
        //$('.modal-backdrop').hide();
		var compiledTemplate = _.template(self.template);
		$('body').append(_.template(compiledTemplate(self.appPreferences.getPrefs())));

		$('#appPreferencesModal').modal('show');
		setupHandlers();
	};

	//options are data model, from AppPreferences.js
	function init(appPreferences) {
		//console.log('setup AppPreferences View...');

		self = this;
		self.appPreferences = appPreferences;
		self.template = template;

	};

	return {
		init: init,
		render: render
	};

});
