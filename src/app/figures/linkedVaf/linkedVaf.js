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

    vm.mutHover = {};

    var vafWidth = 380,
      vafHeight = 380,
      vafMargin = {
        top: 40,
        right: 25,
        bottom: 40,
        left: 55
      },
      bubbleOpacity = 0.5,
      pathOpacity = 0.3,
      vafXMin = 0,
      vafXMax = 65,
      vafYMin = 0,
      vafYMax = 65;

    vm.vaf1Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Relapse 2 vs. Tumor VAF',
      xAxis: 'Tumor VAF',
      yAxis: 'Relapse 2 VAF',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf1',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.vaf2Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Tumor vs. Relapse 1 VAF',
      xAxis: 'Tumor VAF',
      yAxis: 'Relapse 1 VAF',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf2',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.vaf3Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      title: 'Relapse 2 vs. Relapse 1 VAF',
      xAxis: 'Relapse 2 VAF',
      yAxis: 'Relapse 1 VAF',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf3',
      bubbleOpacity: bubbleOpacity,
      data: []
    };

    vm.parallelCoordsOptions = {
      width: 1140,
      height: 380,
      yMax: 100,
      xMax: 0,
      title: 'VAF vs. Treatement Timepoint',
      xAxis: 'Timepoint',
      yAxis: 'Variant Allele Frequency',
      margin: {
        top: 40,
        right: 25,
        bottom: 40,
        left: 55
      },
      id: 'vafParallel',
      pathOpacity: pathOpacity,
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
        });
        var metaData = dataTSV[1].data;

        var clusters = _(vafData)
          .map(function(c) { return Number(c.cluster) })
          .uniq()
          .sortBy()
          .value();

        var clusterScale = clusters.length <= 10 ? d3.scale.category10(): d3.scale.category20();

        var palette = _.map(clusters, function(c) {return clusterScale(c); });

        var clusterMax = clusters.length;

        vm.vaf1Options.data = getVafData(vafData, 1, palette);
        vm.vaf1Options.palette = palette;
        vm.vaf1Options.clusterMax = clusterMax;
        vm.vaf2Options.data = getVafData(vafData, 2, palette);
        vm.vaf2Options.palette = palette;
        vm.vaf2Options.clusterMax = clusterMax;
        vm.vaf3Options.data = getVafData(vafData, 3, palette);
        vm.vaf3Options.palette = palette;
        vm.vaf3Options.clusterMax = clusterMax;
        vm.parallelCoordsOptions.data = getParallelCoordsData(vafData, metaData, palette);
        vm.parallelCoordsOptions.tooltipData = getTooltipData(vafData);
        vm.parallelCoordsOptions.palette = palette;
        vm.parallelCoordsOptions.clusterMax = clusterMax;

        $scope.$on('vafBubbleOver', function(ngEvent, chartId, d3Event, mutation) {
          vm.mutHover = mutation;
          $scope.$apply();
        });
      });

    function getVafData(data, chart, palette) {
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

      return _.map(data, function(mut) {
        return {
          x: Number(mut[specs[chart].x]),
          y: Number(mut[specs[chart].y]),
          chr: Number(mut.chr),
          pos: Number(mut.pos),
          basechange: mut.basechange,
          cluster: Number(mut.cluster),
          annotation: parseAnnotation(mut.annotation)
        }
      });
    }

    function getParallelCoordsData(data, metadata) {
      var vafs = _.map(metadata, 'column_label');

      return _(data)
        .map(function(mut) {
          return _(vafs)
            .map(function(vaf) {
              var meta = _.find(metadata, {column_label: vaf});
              return {
                series: [mut.chr, mut.pos, mut.basechange].join('|'),
                timepoint: Number(meta.timepoint),
                timepointLabel: meta.plot_label,
                vaf: Number(mut[vaf]),
                cluster: Number(mut.cluster),
                chr: Number(mut.chr),
                // pos: Number(mut.pos),
                // basechange: mut.basechange,
                // annotation: parseAnnotation(mut.annotation)
              };
            })
            .value();
        })
        .flatten()
        .sortBy(['series', 'timepoint'])
        .value();
    }

    function getTooltipData(vafData) {
      return _(vafData)
        .map(function(mut) {
          return {
            key: getMutationKey(mut),
            vaf1: Number(mut.vaf1),
            vaf2: Number(mut.vaf2),
            vaf3: Number(mut.vaf3),
            chr: Number(mut.chr),
            pos: Number(mut.pos),
            basechange: mut.basechange,
            cluster: Number(mut.cluster),
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
