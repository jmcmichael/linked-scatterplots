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
    vm.nodePositions = [];
    vm.sankeyFunctions = {};

    vm.vaf1options = {
      'width': 1024,
      'height': 1024,
      'margin': 25,
      'id': 'linkedVaf'
    };

  }

})();
