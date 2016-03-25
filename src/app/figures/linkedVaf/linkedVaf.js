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

    var vafWidth = 1280,
      vafHeight = 1024,
      vafMargin = 20,
      vafXMin = 0,
      vafXMax = 100,
      vafYMin = 0,
      vafYMax = 100;


    vm.vaf1Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      xAxis: 'Tumor',
      yAxis: 'Relapse',
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf1'
    };

    vm.vaf2Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf2'
    };

    vm.vaf3Options = {
      width: vafWidth,
      height: vafHeight,
      margin: vafMargin,
      xMin: vafXMin,
      xMax: vafXMax,
      yMin: vafYMin,
      yMax: vafYMax,
      id: 'vaf3'
    };

    vm.parallelCoordsOptions = {
      width: 1280,
      height: 500,
      margin: 20,
      id: 'parallelCoords'
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
          x: d[specs[chart].x],
          y: d[specs[chart].y],
          pos: d.pos,
          basechange: d.basechange,
          cluster: d.cluster,
          annotation: parseAnnotation(d.annotation)
        }
      });
    }

    function getParallelCoordsData(data) {
      return _.map(data, function(d) {
        return {
          vaf1: d.vaf1,
          vaf2: d.vaf2,
          vaf3: d.vaf3,
          pos: d.pos,
          basechange: d.basechange,
          cluster: d.cluster,
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
