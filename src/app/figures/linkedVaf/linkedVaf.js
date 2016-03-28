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
  function linkedVafController($scope, d3, _) {
    console.log('linkedVafController loaded.');
    var vm = $scope.vm = {};
    var rawData = [];

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
      yAxis: 'Relapse VAF',
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
      yAxis: 'Allo VAF',
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
      xAxis: 'Relapse VAF',
      yAxis: 'Allo VAF',
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
      margin: 20,
      id: 'parallelCoords',
      data: []
    };

    d3.tsv("data/input.aml31_v1a.tsv", function(data) {
      rawData = data;
      vm.vaf1Options.data = getVafData(data, 1);
      vm.vaf2Options.data = getVafData(data, 2);
      vm.vaf3Options.data = getVafData(data, 3);

      vm.parallelCoordsOptions.data = getParallelCoordsData(data);
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
          pos: Number(d.pos),
          basechange: d.basechange,
          cluster: Number(d.cluster),
          annotation: parseAnnotation(d.annotation)
        }
      });
    }

    function getParallelCoordsData(data) {
      return _.map(data, function(d) {
        return {
          vaf1: Number(d.vaf1),
          vaf2: Number(d.vaf2),
          vaf3: Number(d.vaf3),
          pos: Number(d.pos),
          basechange: d.basechange,
          cluster: Number(d.cluster),
          annotation: parseAnnotation(d.annotation)
        }
      });
    }

    function parseAnnotation(ann) {
      return _(ann.split(';'))
        .map(function(s) { return s.split(':');})
        .zipObject()
        .value()
    }


  }

})();
