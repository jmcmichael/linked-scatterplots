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
        data: '=',
        options: '='
      },
      templateUrl: 'components/vaf-scatterplot/vafScatterplot.tpl.html',
      controller: vafScatterplotController

    };
    return directive;
  }

  // @ngInject
  function vafScatterplotController($scope, $timeout, $element, d3, _) {
    console.log('vafScatterplotController loaded.');
  }
})();
