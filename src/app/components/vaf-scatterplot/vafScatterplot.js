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

        var mouseOverHandler = function(chartId, event){
          var keys = _.slice(event.seriesValue, 2, 5);
          var selector = '.' + dimple._createClass(keys).split(' ').join('.')
          $rootScope.$broadcast('vafBubbleOver', event, chartId, selector);
        };

        var mouseLeaveHandler = function(chartId, event){
          // NOTE: it looks like _.showPointTooltip is expecting a *d3* event as 'e', not a dimple event
          // see line 3693 in dimple.latest.js
          // so instead of implementing this as a series.addEventHandler, we need to use d3.select
          // to add a mouseover event that calls _.showPointTooltip, and eimits the $rootScope event.
          var keys = _.slice(event.seriesValue, 2, 5);
          var selector = '.' + dimple._createClass(keys).split(' ').join('.')
          $rootScope.$broadcast('vafBubbleLeave', event, chartId, selector);
        };

        series.addEventHandler('mouseenter', _.partial(mouseOverHandler, options.id));
        series.addEventHandler('mouseleave', _.partial(mouseLeaveHandler, options.id));

        //series.addEventHandler('click', function(e) {
        //  $scope.$emit('vafClick', options.id, e, _.slice(e.seriesValue, 2, 5));
        //});

        var vafBubbleOver = function(ngEvent, dimpleEvent, chartId, selector, chart, series) {
          console.log('+++ Bubble Over caught: ' + selector);
          var currentNode = svg.selectAll(selector).node();

          currentOverStyles = {
            stroke: currentNode.attributes.stroke.nodeValue,
            fill: currentNode.attributes.fill.nodeValue,
            r: currentNode.attributes.r.nodeValue
          };

          svg.selectAll(selector)
            .style("stroke", "darkred")
            .style("fill", "red")
            .attr("r", 10);

        };

        $scope.$on('vafBubbleOver', _.partialRight(vafBubbleOver, chart, series));

        $scope.$on('vafBubbleLeave', function(ngEvent, dimpleEvent, fromChartId, selector) {
          console.log('--- Bubble Leave caught: ' + selector);

          svg.selectAll(selector)
            .style("stroke", currentOverStyles.stroke)
            .style("fill", currentOverStyles.fill)
            .attr("r", currentOverStyles.r);
          currentOverStyles = {};

        });

        series.getTooltipText = _.partial(getTooltipText, data, options);

        chart.draw();

        // axis titles
        xAxis.titleShape.text(options.xAxis);
        yAxis.titleShape.text(options.yAxis);

      }
    });


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
