(function () {
  'use strict';
  angular.module('linkedVaf.figures')
    .controller('linkedVafController', linkedVafController)
    .config(linkedVafConfig);

  // @ngInject
  function linkedVafConfig($stateProvider) {
    $stateProvider
      .state('linkedVaf', {
        url: '/linkedVaf',
        controller: 'linkedVafController',
        templateUrl: 'figures/linkedVaf/linkedVaf.tpl.html'
      });
  }

  // @ngInject
  function linkedVafController($scope, $rootScope, $q, d3, dsv, _) {
    console.log('linkedVafController loaded.');
    var vm = $scope.vm = {};

    vm.chart1 = {};
    vm.chart2 = {};
    vm.chart3 = {};

    vm.vaf1Options = {};
    vm.vaf2Options = {};
    vm.vaf3Options = {};
    vm.parallelCoordsOptions = {
      data: []
    };

    var rawData = [];

    vm.seriesValue = [];
    vm.elementKeys = [];
    vm.selector = '';

    var vafWidth = 400,
      vafHeight = 400,
      vafMargin = {
        top: 15,
        right: 10,
        bottom: 40,
        left: 55
      },
      vafXMin = 0,
      vafXMax = 100,
      vafYMin = 0,
      vafYMax = 100;

    vm.vaf1Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      xAxis: 'Tumor VAF',
      yAxis: 'Relapse 2 VAF',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf1',
      data: []
    };

    vm.vaf2Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      xAxis: 'Tumor VAF',
      yAxis: 'Relapse 1 VAF',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf2',
      data: []
    };

    vm.vaf3Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      xAxis: 'Relapse 2 VAF',
      yAxis: 'Relapse 1 VAF',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf3',
      data: []
    };

    vm.parallelCoordsOptions = {
      width: 1350,
      height: 500,
      yMax: 100,
      xMax: 0,
      margin: {
        top: 15,
        right: 50,
        bottom: 40,
        left: 55
      },
      id: 'vafParallel',
      data: []
    };

    $q.all([
        dsv.tsv({ method:'GET', url: 'data/input.aml31_v1a.tsv.txt' }),
        dsv.tsv({ method:'GET', url: 'data/metadata.tsv.txt' })
      ])
      .then(function(dataTSV) {
        var vafData = _.map(dataTSV[0].data, function(d) {
          d.basechange = d.basechange .replace('/', '-');
          return d;
        }),
          metaData = dataTSV[1].data;
        var clusterScale = d3.scale.category10();
        var clusters = _(vafData)
          .map(function(c) { return Number(c.cluster) })
          .uniq()
          .sortBy()
          .value();

        var clusterPalette = _.map(clusters, function(c) {return clusterScale(c); });

        vm.vaf1Options.data = getVafData(vafData, 1);
        vm.vaf1Options.palette = clusterPalette;
        vm.vaf2Options.data = getVafData(vafData, 2);
        vm.vaf2Options.palette = clusterPalette;
        vm.vaf3Options.data = getVafData(vafData, 3);
        vm.vaf3Options.palette = clusterPalette;
        vm.parallelCoordsOptions.data = getParallelCoordsData(vafData, metaData);
        vm.parallelCoordsOptions.tooltipData = getTooltipData(vafData);
        vm.parallelCoordsOptions.palette = clusterPalette;
      });

    function getVafData(data, chart) {
      var specs = {
        1: {
          x: 'vaf1',
          y: 'vaf3'
        },
        2: {
          x: 'vaf1',
          y: 'vaf2'
        },
        3: {
          x: 'vaf3',
          y: 'vaf2'
        }
      };

      return _.map(data, function(d) {
        return {
          x: Number(d[specs[chart].x]),
          y: Number(d[specs[chart].y]),
          chr: Number(d.chr),
          pos: Number(d.pos),
          basechange: d.basechange,
          cluster: Number(d.cluster),
          annotation: parseAnnotation(d.annotation)
        }
      });
    }

    function getParallelCoordsData(data, metadata) {
      var vafs = _.map(metadata, 'column_label');

      data = _(data)
        .map(function(mut) {
          return {
            vaf1: mut['vaf1'],
            vaf2: mut['vaf2'],
            vaf3: mut['vaf3'],
            chr: Number(mut.chr),
            pos: Number(mut.pos),
            basechange: mut.basechange,
            cluster: Number(mut.cluster),
            annotation: parseAnnotation(mut.annotation)
          }
        })
        .sortBy('chr', 'position', 'basechange')
        .value();

      var pivotVafs= function(data, metadata) {
        var timepoint = {
          timepoint: metadata.timepoint,
          series: metadata.column_label,
          label: metadata.plot_label
        };

        var assignVaf = _.partial(function(timepoint, mutation){
          timepoint[getMutationKey(mutation)] = mutation[timepoint.series];
          return timepoint;
        }, timepoint);

        _(data)
          .map(function(mutation) {
            mutation.basechange = mutation.basechange;
            return mutation;
          })
          .forEach(assignVaf)
          .value();

        return timepoint;
      };

      var coordsToTimepoints = _.partial(pivotVafs, data);

      return _(metadata)
        .map(coordsToTimepoints)
        .value();
    }

    function getTooltipData(vafData) {
      return _(vafData)
        .map(function(mut) {
          return {
            key: getMutationKey(mut),
            vaf1: mut.vaf1,
            vaf2: mut.vaf2,
            vaf3: mut.vaf3,
            chr: mut.chr,
            pos: mut.pos,
            basechange: mut.basechange,
            cluster: mut.cluster,
            annotation: parseAnnotation(mut.annotation)
          }
        })
        .value();
    }

    function getMutationKey(mut) {
      return [mut.chr, mut.pos, mut.basechange].join('|');
    }
    function parseAnnotation(ann) {
      return _(ann.split(';'))
        .map(function(ann) { return ann.split(':');})
        .zipObject()
        .value()
    }


  }

})();
