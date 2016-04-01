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
      width: 1280,
      height: 500,
      yMax: 100,
      xMax: 0,
      margin: {
        top: 15,
        right: 10,
        bottom: 40,
        left: 55
      },
      id: 'vafParallel',
      data: []
    };

    function fetchData(filename) {
      var d = $q.defer();
      dsv.tsv({ method: 'GET', url: 'data/' + filename }).then(
        function(response) {
          d.resolve(response)
        },
        function(error) {
          d.reject(error)
        });

      return d.promise;
    }

    $q.all([
        dsv.tsv({ method:'GET', url: 'data/input.aml31_v1a.tsv.txt' }),
        dsv.tsv({ method:'GET', url: 'data/metadata.tsv.txt' })
      ])
      .then(function(dataTSV) {
        var vafData = dataTSV[0].data,
          metaData = dataTSV[1].data;

        vm.vaf1Options.data = getVafData(vafData, 1);
        vm.vaf2Options.data = getVafData(vafData, 2);
        vm.vaf3Options.data = getVafData(vafData, 3);
        vm.parallelCoordsOptions.data = getParallelCoordsData(vafData, metaData);
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
          basechange: d.basechange.replace('/', '-'),
          cluster: Number(d.cluster),
          annotation: parseAnnotation(d.annotation)
        }
      });
    }

    function getParallelCoordsData(data, metadata) {
      var vafs = _.map(metadata, 'column_label');

      var getPoint = function(mutation, vaf) {
        return {
          vaf: Number(mutation[vaf]),
          pos: Number(mutation.pos),
          basechange: mutation.basechange.replace('/', '-'),
          cluster: Number(mutation.cluster),
          annotation: parseAnnotation(mutation.annotation)
        };
      };

      var getSeries = function(mutation, vafs) {
        return _.map(vafs, function(vaf) { return getPoint(mutation, vaf)})
      };

      return _(data)
        .map(function(mut) {
          return getSeries(mut, vafs);
        })
        .value();
    }

    function parseAnnotation(ann) {
      return _(ann.split(';'))
        .map(function(ann) { return ann.split(':');})
        .zipObject()
        .value()
    }


  }

})();
