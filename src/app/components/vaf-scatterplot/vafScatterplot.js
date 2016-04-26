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

        // post-render styling (TODO: implement with dimple custom format?)
        chart.svg.selectAll('circle.dimple-bubble')
          .style('opacity', options.bubbleOpacity);

        // overwrite mouse events w/ functions that broadcast ng events
        var mouseoverHandler = function(chartId, broadcast, event){
          dimple._showPointTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleOver', chartId, event, getMutKeyFromEvent(event));
          }
        };

        var mouseleaveHandler = function(chartId, broadcast, event){
          dimple._removeTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleLeave', chartId, event, getMutKeyFromEvent(event));
          }
        };

        series.shapes
          .on('mouseover', _.partial(mouseoverHandler, options.id, true))
          .on('mouseleave', _.partial(mouseleaveHandler, options.id, true));

        // listen for bubbleOver events and trigger mouse events on matching bubbles
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

        var varBubbleOverHandler = function(chart, ngEvent, chartId, d3Event, mutation){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            triggerMouseEvent(chart.svg.select(getBubbleSelector(mutation)), 'mouseover');
          }
        };

        var varBubbleLeaveHandler = function(chart, ngEvent, chartId, d3Event, mutation){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            triggerMouseEvent(chart.svg.select(getBubbleSelector(mutation)), 'mouseleave');
          }
        };

        $scope.$on('vafBubbleOver', _.partial(varBubbleOverHandler, chart));
        $scope.$on('vafBubbleLeave', _.partial(varBubbleLeaveHandler, chart));

        // axis titles
        xAxis.titleShape.text(options.xAxis);
        yAxis.titleShape.text(options.yAxis);

      }
    });

    function getMutKeyFromEvent(d3Event) {
      var keys = _(_.trimRight(d3Event.key, '_')).split('/').slice(3,6).value(); // pull chr, pos, basechange
      return { chr: Number(keys[0]), pos: Number(keys[1]), basechange: keys[2] };
    }

    function getBubbleSelector(mutation) {
      var keys = _.values(mutation);
      return '.' + dimple._createClass(keys).split(' ').join('.');
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
  }
})();
