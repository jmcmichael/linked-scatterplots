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
      controller: vafScatterplotController

    };
    return directive;
  }

  // @ngInject
  function vafScatterplotController($scope, $rootScope, $element, d3, dimple, _) {
    console.log('vafScatterplotController loaded.');
    var options = $scope.options;

    var svg = d3.select($element[0])
      .append('svg')
      .attr('width', options.width)
      .attr('height', options.height)
      .attr('id', options.id);

    var chart = new dimple.chart(svg, options.data);

    var currentOverStyles = {};

    $scope.chart = chart;

    var mouseEvents = [];

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
        var colorAxis = chart.addMeasureAxis('color', 'cluster');

        xAxis.overrideMax = options.xMax;
        yAxis.overrideMax = options.yMax;

        var series = chart.addSeries(['x', 'y', 'chr', 'pos', 'basechange', 'cluster'], dimple.plot.bubble);

        series.getTooltipText = _.partial(getTooltipText, data, options);

        chart.draw();

        // overwrite mouse events w/ functions that broadcast ng events
        var mouseOverHandler = function(chartId, broadcast, event){
          dimple._showPointTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleOver', chartId, event);
          }
        };

        var mouseLeaveHandler = function(chartId, broadcast, event){
          dimple._removeTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleLeave', chartId, event);
          }
        };

        series.shapes
          .on('mouseover', _.partial(mouseOverHandler, options.id, true))
          .on('mouseleave', _.partial(mouseLeaveHandler, options.id, true));

        var varBubbleOverHandler = function(chart, ngEvent, chartId, d3Event){
          if (chartId !== options.id) {
            chart.svg.select(getBubbleSelector(d3Event.key)).each(function(d, i) {
              console.log('triggering mouse over for: ' + getBubbleSelector(d3Event.key));
              d3.select(this)
                .on('mouseover', _.partial(mouseOverHandler, options.id, false));

              var e = document.createEvent('UIEvents');
              e.initUIEvent("mouseover", true, true, window, 1);
              d3.select(this).node().dispatchEvent(e);

              // replace w/ broadcast call
              d3.select(this)
                .on('mouseover', _.partial(mouseOverHandler, options.id, true));
            });
          }
        };

        var varBubbleLeaveHandler = function(chart, ngEvent, chartId, d3Event){
          if (chartId !== options.id) {
            chart.svg.select(getBubbleSelector(d3Event.key)).each(function(d, i) {
              console.log('triggering mouse leave for: ' + getBubbleSelector(d3Event.key));
              var click = d3.select(this)
                .on('mouseleave', _.partial(mouseLeaveHandler, options.id, false));

              var e = document.createEvent('UIEvents');
              e.initUIEvent("mouseleave", true, true, window, 1)
              d3.select(this).node().dispatchEvent(e);

              // replace w/ broadcast call
              d3.select(this)
                .on('mouseleave', _.partial(mouseLeaveHandler, options.id, true));
            });
          }
        };

        // capture over/leave events
        $scope.$on('vafBubbleOver', _.partial(varBubbleOverHandler, chart));
        $scope.$on('vafBubbleLeave', _.partial(varBubbleLeaveHandler, chart));

        // axis titles
        xAxis.titleShape.text(options.xAxis);
        yAxis.titleShape.text(options.yAxis);

        // catch bubble over/leave events, show proper tooltip

      }
    });

    function getBubbleSelector(eventKey) {
      var keys = _(eventKey).split('/').slice(2,5).value(); // pull chr, pos, basechange
      return '.' + dimple._createClass(keys).split(' ').join('.');
    }

    function simulateMouseEvent(element, event){
      var evt = document.createEvent('SVGEvents');
      evt.initEvent(event,false,true);
      return !element.dispatchEvent(evt); //Indicate if `preventDefault` was called during handling
    }

    function getTooltipText(data, options, d) {
      var item = _.find(data, {x: d.xValue, y: d.yValue});
      var tipObj = {};

      tipObj[options.xAxis] = item.x;
      tipObj[options.yAxis] = item.y;

      tipObj['Chromosome'] = item.chr;
      tipObj['Position'] = item.pos;
      tipObj['Base Change'] = item.basechange;
      tipObj['Cluster'] = item.cluster;


      _.forEach(item.annotation, function(val,key){
        tipObj[_.capitalize(key)] = val;
      });

      return _.map(tipObj, function(val, key) {
        return [key, val].join(': ');
      });

    }

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
