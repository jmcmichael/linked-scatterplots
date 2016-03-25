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
      link: vafScatterplotLink,
      controller: vafScatterplotController

    };
    return directive;
  }

  function vafScatterplotLink(scope, elem, attrs) {
    scope.elem = elem;
  }

  // @ngInject
  function vafScatterplotController($scope, $element, d3, _) {
    console.log('vafScatterplotController loaded.');

    var svg = d3.select($element.find('svg')[0]);

  }
})();
