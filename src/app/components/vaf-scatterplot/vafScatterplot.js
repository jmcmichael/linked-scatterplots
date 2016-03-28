(function() {
  'use strict';
  angular.module('linkedVaf.figures')
    .directive('vafScatterplot', vafScatterplot)
    .controller('vafScatterplotController', vafScatterplotController);

  // @ngInject
  function vafScatterplot() {
    var directive = {
      restrict: 'EA',
      scope: {
        options: '='
      },
      link: vafScatterplotLink,
      controller: vafScatterplotController

    };
    return directive;
  }

  function vafScatterplotLink(scope, elem, attrs) {
    scope.elem = elem;
  }

  // @ngInject
  function vafScatterplotController($scope, $element, d3, dimple, _) {
    console.log('vafScatterplotController loaded.');
    var options = $scope.options;

    var svg = d3.select($element[0])
      .append('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('id', options.id);

    //svg.append("rect")
    //  .attr("width", "100%")
    //  .attr("height", "100%")
    //  .attr("fill", "white");
    var chart = new dimple.chart(svg, options.data);

    $scope.chart = chart;

    $scope.$watch('options.data', function(data) {
      if (data.length > 0) {

        chart.data = data;
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

        var xAxis = chart.addMeasureAxis('x', 'x');
        var yAxis = chart.addMeasureAxis('y', 'y');
        var colorAxis = chart.addMeasureAxis('color', 'cluster')

        xAxis.overrideMax = options.xMax;
        yAxis.overrideMax = options.yMax;

        var series = chart.addSeries(['x', 'y', 'pos', 'basechange', 'cluster'], dimple.plot.bubble);

        series.addEventHandler('click', function(e) {
          $scope.$emit('vafClick', e, options.id);
        });

        $scope.$on('highlightPoint', function(ngEvent, fromChart, seriesValue) {
          if (fromChart != options.id) {
            console.log('Highlighting point: ' + seriesValue);
          }
        });


        var getTooltipText = function (data, options, d) {
          var item = _.find(data, {x: d.xValue, y: d.yValue});
          var tipObj = {};

          tipObj[options.xAxis] = item.x;
          tipObj[options.yAxis] = item.y;

          tipObj['Base Change'] = item.basechange;
          tipObj['Cluster'] = item.cluster;
          tipObj['Position'] = item.pos;

          _.forEach(item.annotation, function(val,key){
            tipObj[_.capitalize(key)] = val;
          });

          return _.map(tipObj, function(val, key) {
            return [key, val].join(': ');
          });

        };

        series.getTooltipText = _.partial(getTooltipText, data, options);

        chart.draw();

        // axis titles
        xAxis.titleShape.text(options.xAxis);
        yAxis.titleShape.text(options.yAxis);
      }
    });


    //d3.tsv("/data/example_data.tsv", function (data) {
    //  data = dimple.filterData(data, "Date", "01/12/2012");
    //  var myChart = new dimple.chart(svg, data);
    //  myChart.setBounds(60, 30, 500, 330)
    //  myChart.addMeasureAxis("x", "Unit Sales");
    //  myChart.addMeasureAxis("y", "Operating Profit");
    //  myChart.addSeries(["SKU", "Channel"], dimple.plot.bubble);
    //  myChart.addLegend(200, 10, 360, 20, "right");
    //  myChart.draw();
    //});

  }
})();
