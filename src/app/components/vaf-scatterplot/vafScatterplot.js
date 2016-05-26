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
        options: '=',
        palette: '='
      },
      controller: vafScatterplotController

    };
    return directive;
  }

  // @ngInject
  function vafScatterplotController($scope, $rootScope, $element,
                                    d3, dimple, _) {
    console.log('vafScatterplotController loaded.');
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

    var xAxis = chart.addMeasureAxis('x', 'x');
    var yAxis = chart.addMeasureAxis('y', 'y');
    var colorAxis = chart.addColorAxis('cluster', $scope.palette);

    var series = chart.addSeries(['x', 'y', 'cluster', 'chr', 'pos', 'basechange'], dimple.plot.bubble);

    $scope.$watch('options.data', function(data) {
      series.getTooltipText = _.partial(getTooltipText, data, options);

      xAxis.overrideMax = _.isUndefined(options.xMax) ? 100 : options.xMax;
      yAxis.overrideMax = _.isUndefined(options.yMax) ? 100 : options.yMax;

      chart.data = data;
      chart.draw(500);

      // post-render styling (TODO: implement with dimple custom format?)
      chart.svg.selectAll('circle.dimple-bubble')
        .style('opacity', options.bubbleOpacity);

      // axis titles
      xAxis.titleShape
        .text(options.xAxis)
        .style('font-weight', 'bold');

      yAxis.titleShape
        .text(options.yAxis)
        .style('font-weight', 'bold');

      series.shapes
        .on('mouseover', _.partial(mouseoverHandler, options.id, true))
        .on('mouseleave', _.partial(mouseleaveHandler, options.id, true));

      var filterExtent = _.partial(function(series, extent) {
        var selected = [];
        series.shapes.classed('selected', function(d) {
          var hit = extent[0][0] <= d.cx && d.cx < extent[1][0]
            && extent[0][1] <= d.cy && d.cy < extent[1][1];
          if(hit) {
            selected.push(getMutKeyFromEvent(d));
          }
        });
        $rootScope.$broadcast('vafSelected', selected);
      }, series);

      var vafSelectBrush = d3.svg.brush()
        .x(xAxis._scale)
        .y(yAxis._scale)
        .on('brushstart', function() {
          console.log(options.id + 'sending vafselectedStart');
          $rootScope.$broadcast('vafSelectedStart', options.id);
        })
        .on('brushend', function() {
          var extent = d3.event.target.extent();
          filterExtent(extent);
        });

      chart.svg.append('g')
        .attr('class', 'brush')
        .call(vafSelectBrush);

      $scope.$on('vafSelectedStart', function(ngEvent, vafId) {
        if(vafId !== options.id && !vafSelectBrush.empty()) {
          console.log(options.id + ' clearing vafSelectBrush');
          vafSelectBrush.clear();
        }
      });
    });

    /**
     * mouseover/leave callbacks and handlers
     */

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

    function getSelected() {
      svg.selectAll('circle')
        .classed('selected', function(d) {
          return d._selected;
        })
    }

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
