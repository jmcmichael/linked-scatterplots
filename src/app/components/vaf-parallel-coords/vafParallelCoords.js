(function() {
  'use strict';
  angular.module('linkedVaf.figures')
    .directive('vafParallelCoords', vafParallelCoords)
    .controller('vafParallelCoordsController', vafParallelCoordsController);

  // @ngInject
  function vafParallelCoords() {
    var directive = {
      restrict: 'EA',
      scope: {
        options: '='
      },
      controller: vafParallelCoordsController

    };
    return directive;
  }

  // @ngInject
  function vafParallelCoordsController($scope, $rootScope, $element, d3, dimple, _) {
    console.log('vafParallelCoordsController loaded.');
    var options = $scope.options;

    var svg = d3.select($element[0])
      .append('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('id', options.id);

    $scope.$watch('options.data', function(data) {
      if (data.length > 0) {
        var tooltipData = options.tooltipData;

        var chart = new dimple.chart(svg);

        $scope.chart = chart;

        chart.setBounds(
          options.height - options.margin.top - options.margin.bottom,
          options.width - options.margin.left - options.margin.right
        );

        chart.setMargins(
          options.margin.left,
          options.margin.top,
          options.margin.right,
          options.margin.bottom
        );

        // create x axis for time
        // var timepointAxis = chart.addMeasureAxis('x', 'timepoint');
        // var vafAxis = chart.addMeasureAxis('y', 'vaf');
        // var colorAxis = chart.addColorAxis('cluster', options.palette);
        // colorAxis.overrideMax = options.clusterMax;
        // colorAxis.overrideMin = 1;
        //
        // var lineSeries = chart.addSeries(
        //   ['series', 'timepoint', 'cluster'],
        //   dimple.plot.line,
        //   [vafAxis, timepointAxis, colorAxis]);
        //
        // chart.data = data;

        var exData = [
          { 'Brand':'Coolio', 'Day':'Mon', 'Sales Volume':1000 },
          { 'Brand':'Coolio', 'Day':'Tue', 'Sales Volume':1100 },
          { 'Brand':'Coolio', 'Day':'Wed', 'Sales Volume':900 },
          { 'Brand':'Coolio', 'Day':'Thu', 'Sales Volume':800 },
          { 'Brand':'Coolio', 'Day':'Fri', 'Sales Volume':850 },
          { 'Brand':'Uncoolio', 'Day':'Mon', 'Sales Volume':200 },
          { 'Brand':'Uncoolio', 'Day':'Tue', 'Sales Volume':100 },
          { 'Brand':'Uncoolio', 'Day':'Wed', 'Sales Volume':300 },
          { 'Brand':'Uncoolio', 'Day':'Thu', 'Sales Volume':250 },
          { 'Brand':'Uncoolio', 'Day':'Fri', 'Sales Volume':350 }
        ];
        var x = chart.addCategoryAxis('x', 'timepointLabel');
        x.addOrderRule('timepoint');
        var y = chart.addMeasureAxis('y', 'vaf');
        var c = chart.addColorAxis('cluster', options.palette);
        c.overrideMax = options.clusterMax;
        c.overrideMin = 1;
        
        chart.addSeries('series', dimple.plot.line);
        chart.data = data;

        chart.draw();

      }
    });

  }
})();
