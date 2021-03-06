;( function() {
	
	"use strict";
	
	var App = require( "./../../../namespaces.js" );

	App.Views.Form.DimensionsSectionView = Backbone.View.extend({

		el: "#form-view #data-tab .dimensions-section",
		events: {
			"change [name='chart-type']": "onChartTypeChange",
			"change [name='group-by-variable']": "onGroupByVariableChange",
		},

		initialize: function( options ) {
			
			this.dispatcher = options.dispatcher;
			App.ChartDimensionsModel.on( "reset change", this.render, this );

			this.dispatcher.on( "dimension-update", this.onDimensionUpdate, this );
			
			this.render();

		},

		inited: false,

		render: function() {

			this.$formSectionContent = this.$el.find( ".form-section-content" );
			this.$dimensionsInput = this.$el.find( "[name='chart-dimensions']" );
			this.$groupByVariable = this.$el.find( ".group-by-variable-wrapper" );
			this.$groupByVariableInput = this.$groupByVariable.find( "[name='group-by-variable']" );

			//get rid of old content
			this.$formSectionContent.empty();

			//construct html
			var chartType = App.ChartDimensionsModel.id,
				dimensions = App.ChartDimensionsModel.get( "chartDimensions" ),
				htmlString = "<ol class='dimensions-list chart-type-" + chartType + "'>";

			_.each( dimensions, function( v, k ) {
				htmlString += "<li data-property='" + v.property + "' class='dimension-box'><h4>" + v.name + "</h4><div class='dd-wrapper'><div class='dd'><div class='dd-empty'></div></div></div></li>";
			} );

			htmlString += "</ol>";

			var $html = $( htmlString );
			this.$formSectionContent.append( $html );

			//init nestable 
			this.$dd = this.$el.find( ".dd" );
			//nestable destroy
			this.$dd.nestable();
						
			//fetch remaing dom
			this.$dimensionBoxes = this.$el.find( ".dimension-box" );

			var that = this;
			this.$dd.on('change', function() {
				that.updateInput();
			});

			//if editing chart - assign possible chart dimensions to available dimensions
			var chartDimensions = App.ChartModel.get( "chart-dimensions" );
			this.setInputs( chartDimensions );

			//handle group by variable checkbox
			if( App.ChartModel.get( "chart-type" ) == 1 || App.ChartModel.get( "chart-type" ) == 3 ) {
				//is linechart, so this checkbox is relevant
				var groupByVariables = App.ChartModel.get( "group-by-variables" );
				this.$groupByVariableInput.prop( "checked", groupByVariables );
				this.$groupByVariable.show();
			} else {
				//is not linechart, make sure grouping of variables is off and hide input
				App.ChartModel.set( "group-by-variables", false );
				this.$groupByVariable.hide();
			}
			
			//if scatter plot, only entity match
			/*var $onlyEntityMatchCheck = $( "<div class='only-entity-check-wrapper'><label><input type='checkbox' name='only-entity-check' />Match variables only by countries, not years.</label></div>" ),
				$onlyEntityInput = $onlyEntityMatchCheck.find( "input" );
			$onlyEntityInput.on( "change", function( evt ) {
				var $this = $( this );
				App.ChartModel.set( "only-entity-match", $this.prop( "checked" ) );
			} );
			//set default value
			$onlyEntityInput.prop( "checked", App.ChartModel.get( "only-entity-match" ) );
			this.$formSectionContent.append( $onlyEntityMatchCheck );*/
			
		},

		updateInput: function() {
			
			var dimensions = [];
			$.each( this.$dimensionBoxes, function( i, v ) {
				var $box = $( v ),
					$droppedVariables = $box.find( ".variable-label" );
				if( $droppedVariables.length ) {
					//just in case there were more variables
					$.each( $droppedVariables, function( i, v ) {
						var $droppedVariable = $( v ),
							dimension = { variableId: $droppedVariable.attr( "data-variable-id" ), displayName: $droppedVariable.attr( "data-display-name" ), property: $box.attr( "data-property" ), unit: $droppedVariable.attr( "data-unit" ), name: $box.find( "h4" ).text(), period: $droppedVariable.attr( "data-period" ), mode: $droppedVariable.attr( "data-mode" ), targetYear: $droppedVariable.attr( "data-target-year" ), tolerance: $droppedVariable.attr( "data-tolerance" ), maximumAge: $droppedVariable.attr( "data-maximum-age" ) };
						dimensions.push( dimension );
					} );
				}
			} );

			var json = JSON.stringify( dimensions );
			this.$dimensionsInput.val( json );
			App.ChartModel.set( "chart-dimensions", json );

		},

		setInputs: function( chartDimensions ) {

			if( !chartDimensions || !chartDimensions.length ) {
				return;
			}

			//convert to json
			chartDimensions = $.parseJSON( chartDimensions );

			var that = this;
			_.each( chartDimensions, function( chartDimension, i ) {

				//find variable label box from available variables
				var $variableLabel = $( ".variable-label[data-variable-id=" + chartDimension.variableId + "]" );

				//copy variables attributes
				if( chartDimension.period ) {
					$variableLabel.attr( "data-period", chartDimension.period );
				}
				if( chartDimension.mode ) {
					$variableLabel.attr( "data-mode", chartDimension.mode );
				}
				if( chartDimension.targetYear ) {
					$variableLabel.attr( "data-target-year", chartDimension.targetYear );
				}
				if( chartDimension.tolerance ) {
					$variableLabel.attr( "data-tolerance", chartDimension.tolerance );
				}
				if( chartDimension.maximumAge ) {
					$variableLabel.attr( "data-maximum-age", chartDimension.maximumAge );
				}
				if( chartDimension.displayName ) {
					$variableLabel.find( ".variable-label-name" ).text( chartDimension.displayName );
				}

				//find appropriate dimension box for it by data-property
				var $dimensionBox = that.$el.find( ".dimension-box[data-property=" + chartDimension.property + "]" );
				//remove empty and add variable box
				$dimensionBox.find( ".dd-empty" ).remove();
				var $ddList = $( "<ol class='dd-list'></ol>" );
				$ddList.append( $variableLabel );
				$dimensionBox.find( ".dd" ).append( $ddList );
				that.dispatcher.trigger( "variable-label-moved" );

			} );
	
		},

		onChartTypeChange: function( evt ) {

			var $select = $( evt.currentTarget );
			App.ChartDimensionsModel.loadConfiguration( $select.val() );

		},

		onDimensionUpdate: function() {
			this.updateInput();
		},

		onGroupByVariableChange: function( evt ) {

			var $input = $( evt.currentTarget );
			App.ChartModel.set( "group-by-variables", $input.is( ":checked" ) );

		}

	});
	
	module.exports = App.Views.Form.DimensionsSectionView;
	
})();