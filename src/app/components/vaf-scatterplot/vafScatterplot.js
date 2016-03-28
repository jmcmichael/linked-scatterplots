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

    svg.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "white");

    $scope.$watch('options.data', function(data) {
      if (data.length > 0) {
        var chart = new dimple.chart(svg, options.data);

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

        xAxis.overrideMax = 100;
        yAxis.overrideMax = 100;

        var series = chart.addSeries(['x', 'y'], dimple.plot.bubble);

        var getText = function (data, d) {
          var i,
            tooltip = ['test'];

          //for (i = 0; i < data.length; i += 1) {
          //  if (d3.time.format("%Y-%m-%d")(d.x) === data[i].request_date) {
          //    tooltip.push("Project ID: " + data[i].project_id);
          //    tooltip.push("Service Duration: " + data[i].service_durations_days + " day(s)");
          //    tooltip.push("Days Overdue: " + data[i].days_overdue);
          //    tooltip.push("Active Services: " + data[i].active_services);
          //    tooltip.push("Project Status: " + data[i].project_status);
          //  }
          //}
          return tooltip;
        };


        series.getTooltipText = _.partial(getText, data);

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
