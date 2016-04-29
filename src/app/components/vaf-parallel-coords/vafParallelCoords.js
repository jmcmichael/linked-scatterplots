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
      .attr('id', options.id)
      .style('overflow', 'visible');

    // title
    svg.append('text')
      .attr('x', options.margin.left)
      .attr('y', options.margin.top - 10)
      .style('text-anchor', 'left')
      .style('font-family', 'sans-serif')
      .style('font-weight', 'bold')
      .text(options.title);

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

        var x = chart.addCategoryAxis('x', 'timepointLabel');
        x.addOrderRule('timepoint');
        var y = chart.addMeasureAxis('y', 'vaf');
        var c = chart.addColorAxis('cluster', ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf"]);
        c.overrideMax = options.clusterMax;
        c.overrideMin = 1;

        var series = chart.addSeries('series', dimple.plot.line);
        series.lineMarkers = true;

        series.getTooltipText = _.partial(getTooltipText, data, options);

        chart.data = data;
        chart.draw();

        // post-render styling (TODO: implement with dimple custom format?)
        chart.svg.selectAll('path.dimple-line')
          .style('opacity', options.pathOpacity);

        // overwrite mouse events w/ functions that broadcast ng events
        var mouseoverHandler = function(chartId, broadcast, series, event){
          dimple._showPointTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleOver', chartId, event, getMutFromEvent(event));
          }
        };

        var mouseleaveHandler = function(chartId, broadcast, series, event){
          dimple._removeTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleLeave', chartId, event, getMutFromEvent(event));
          }
        };

        chart.svg.selectAll('circle.dimple-marker')
          .on('mouseover', _.partial(mouseoverHandler, options.id, true, series))
          .on('mouseleave', _.partial(mouseleaveHandler, options.id, true, series));

        // listen for bubbleOver events and trigger mouse events on matching bubbles
        var triggerMouseEvent = function(elements, event, series) {
          var handlers = {
            mouseover: mouseoverHandler,
            mouseleave: mouseleaveHandler
          };

          elements.each(function(d, i) {
            // attach non-broadcasting event handler
            d3.select(this).on(event, _.partial(handlers[event], options.id, false, series));
            // create and dispatch event
            var e = new UIEvent(event, { 'view': window, 'bubbles': true, 'cancelable': true });
            d3.select(this).node().dispatchEvent(e);
            // reattach broadcasting event handler
            d3.select(this).on(event, _.partial(handlers[event], options.id, true, series));
          });
        };

        var varBubbleOverHandler = function(chart, ngEvent, chartId, d3Event, mutation){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            // find series w/ matching elements
            var elements = _(chart.data)
              .filter(function(point) {
                var key = [mutation.chr, mutation.pos, mutation.basechange].join('|');
                return point.series === key;
              })
              .value();

            _.forEach(elements, function(s) {
              triggerMouseEvent(chart.svg.selectAll(getBubbleSelector(mutation)), 'mouseover', series);
            });
          }
        };

        var varBubbleLeaveHandler = function(chart, ngEvent, chartId, d3Event, mutation){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            var series = _(chart.data)
              .filter(function(point) {
                var key = [mutation.chr, mutation.pos, mutation.basechange].join('|');
                return point.series === key;
              })
              .value();

            _.forEach(series, function(s) {
              triggerMouseEvent(chart.svg.selectAll(getBubbleSelector(mutation)), 'mouseleave', s);
            });

          }
        };

        $scope.$on('vafBubbleOver', _.partial(varBubbleOverHandler, chart));
        $scope.$on('vafBubbleLeave', _.partial(varBubbleLeaveHandler, chart));

        // axis titles
        x.titleShape
          .text(options.xAxis)
          .style('font-weight', 'bold');

        y.titleShape
          .text(options.yAxis)
          .style('font-weight', 'bold');
      }

      function getMutKeyFromEvent(d3Event) {
        var keys = _(_.trimRight(d3Event.key, '_')).split('/').slice(3,6).value(); // pull chr, pos, basechange
        return { chr: Number(keys[0]), pos: Number(keys[1]), basechange: keys[2] };
      }

      function getMutFromEvent(d3Event) {
        var keys = _(_.trimRight(d3Event.key, '_'))
          .split('_')
          .dropRight(1)
          .split('|')
          .value(); // pull chr, pos, basechange

        return { chr: Number(keys[0]), pos: Number(keys[1]), basechange: keys[2] };
      }

      function getBubbleSelector(mutation) {
        return 'circle.dimple-marker.dimple-' + _.values(mutation).join('-').toLowerCase();
      }

      function getTooltipText(data, options, d3Event) {
        var item = _.find(options.tooltipData, getMutFromEvent(d3Event));

        var tipObj = {};

        tipObj.vaf1 = item.vaf1;
        tipObj.vaf2 = item.vaf2;
        tipObj.vaf3 = item.vaf3;
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
    });

  }
})();
