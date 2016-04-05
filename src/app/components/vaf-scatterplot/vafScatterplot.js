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

    $scope.$watch('options.data', function(data) {
      if (data.length > 0) {
        var chart = new dimple.chart(svg, data);

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

        var xAxis = chart.addMeasureAxis('x', 'x');
        var yAxis = chart.addMeasureAxis('y', 'y');
        var colorAxis = chart.addColorAxis('cluster', options.palette);

        xAxis.overrideMax = options.xMax;
        yAxis.overrideMax = options.yMax;

        var series = chart.addSeries(['x', 'y', 'cluster', 'chr', 'pos', 'basechange'], dimple.plot.bubble);

        series.getTooltipText = _.partial(getTooltipText, data, options);

        chart.draw();

        // overwrite mouse events w/ functions that broadcast ng events
        var mouseoverHandler = function(chartId, broadcast, event){
          dimple._showPointTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleOver', chartId, event);
          }
        };

        var mouseleaveHandler = function(chartId, broadcast, event){
          dimple._removeTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleLeave', chartId, event);
          }
        };

        var triggerMouseEvent = function(elements, event) {
          var handlers = {
            mouseover: mouseoverHandler,
            mouseleave: mouseleaveHandler
          };

          elements.each(function(d, i) {
            // attach non-broadcasting event handler
            d3.select(this).on(event, _.partial(handlers[event], options.id, false));
            // create and dispatch event
            var e = new UIEvent(event, { 'view': window, 'bubbles': true, 'cancelable': true });
            d3.select(this).node().dispatchEvent(e);
            // reattach broadcasting event handler
            d3.select(this).on(event, _.partial(handlers[event], options.id, true));
          });
        };

        series.shapes
          .on('mouseover', _.partial(mouseoverHandler, options.id, true))
          .on('mouseleave', _.partial(mouseleaveHandler, options.id, true));

        var varBubbleOverHandler = function(chart, ngEvent, chartId, d3Event){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            triggerMouseEvent(chart.svg.select(getBubbleSelector(d3Event.key)), 'mouseover');
          }
        };

        var varBubbleLeaveHandler = function(chart, ngEvent, chartId, d3Event){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            triggerMouseEvent(chart.svg.select(getBubbleSelector(d3Event.key)), 'mouseleave');
          }
        };

        $scope.$on('vafBubbleOver', _.partial(varBubbleOverHandler, chart));
        $scope.$on('vafBubbleLeave', _.partial(varBubbleLeaveHandler, chart));

        // axis titles
        xAxis.titleShape.text(options.xAxis);
        yAxis.titleShape.text(options.yAxis);

      }
    });

    function getBubbleSelector(eventKey) {
      var keys = _(eventKey).split('/').slice(2,5); // pull chr, pos, basechange
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
