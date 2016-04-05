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
        var timepointAxis = chart.addMeasureAxis('x', 'timepoint');
        // create multiple VAF y axes for each mutation

        // create first yAxis⁄⁄
        var vafAxes = {};
        var masterYAxis = vafAxes[tooltipData[0].key] = chart.addMeasureAxis('y', 'vaf');
        // then append the rest
        _.forEach(tooltipData, function(mut, index) {
          vafAxes[mut.key] = chart.addMeasureAxis(masterYAxis, 'vaf');
        });
        var colorAxis = chart.addColorAxis('cluster', options.palette);

        var bubbleSeries = _.map(tooltipData, function(mut) {
          var series = chart.addSeries(
            ['vaf', 'timepoint', 'chr', 'pos', 'basechange', 'cluster'],
            dimple.plot.bubble,
            [timepointAxis, vafAxes[mut.key]]);

          series.data = _(data)
            .map(function(d) {
              return _.merge({
                vaf: d[mut.key],
                timepoint:d['timepoint']
              }, mut);
            })
            .value();

          series.getTooltipText = _.partial(getTooltipText, mut, options);
          return series;
        });

        chart.draw();

        // overwrite mouse events w/ functions that broadcast ng events
        var mouseoverHandler = function(chartId, broadcast, series, event){
          dimple._showPointTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleOver', chartId, event);
          }
        };

        var mouseleaveHandler = function(chartId, broadcast, series, event){
          dimple._removeTooltip(event, this, chart, series);
          if(broadcast) {
            $rootScope.$broadcast('vafBubbleLeave', chartId, event);
          }
        };

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

        _.forEach(bubbleSeries, function(series) {
          series.shapes
            .on('mouseover', _.partial(mouseoverHandler, options.id, true, series))
            .on('mouseleave', _.partial(mouseleaveHandler, options.id, true, series));
        });

        var varBubbleOverHandler = function(chart, ngEvent, chartId, d3Event){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            // find series w/ matching elements
            var series = _(chart.series)
              .filter(function(s) {
                return _(s.data)
                    .filter(getMutFromKey(d3Event.key))
                    .value()
                    .length > 0;
              })
              .value();

            _.forEach(series, function(s) {
              triggerMouseEvent(chart.svg.selectAll(getBubbleSelector(d3Event.key)), 'mouseover', s);
            });
          }
        };

        var varBubbleLeaveHandler = function(chart, ngEvent, chartId, d3Event){
          if (chartId !== options.id) { // only trigger if current chart didn't originate vafBubble event
            var series = _(chart.series)
              .filter(function(s) {
                return _(s.data)
                    .filter(getMutFromKey(d3Event.key)) // better to use s.shapes.select but that doesn't appear to work
                    .value()
                    .length > 0;
              })
              .value();

            _.forEach(series, function(s) {
              triggerMouseEvent(chart.svg.selectAll(getBubbleSelector(d3Event.key)), 'mouseleave', s);
            });

          }
        };

        $scope.$on('vafBubbleOver', _.partial(varBubbleOverHandler, chart));
        $scope.$on('vafBubbleLeave', _.partial(varBubbleLeaveHandler, chart));

        // axis titles
        //xAxis.titleShape.text(options.xAxis);
        //yAxis.titleShape.text(options.yAxis);

      }
    });

    function getMutationKey(mut) {
      return [mut.chr, mut.pos, mut.basechange].join('|');
    }

    function getBubbleSelector(eventKey) {
      var keys = _(eventKey).split('/').slice(2,5).value(); // pull chr, pos, basechange
      return '.' + dimple._createClass(keys).split(' ').join('.');
    }
    function getMutFromKey(eventKey) {
      var keys = _(eventKey).split('/').slice(2,5).value(); // pull chr, pos, basechange

      return { chr: keys[0], pos: keys[1], basechange: keys[2] };
    }

    function getTooltipText(data, options, d) {
      var item = _.find(options.tooltipData, {chr: data.chr, pos: data.pos, basechange: data.basechange });

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
