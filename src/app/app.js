(function() {
    'use strict';
    //This is the basic entry point of the application
    angular.module('pancan2App', [
      'ui.router',
      'ngResource',
      'formly',
      'formlyBootstrap',
      'ui.grid',
      'ui.grid.selection',
      'colorpicker.module',
      'angularAwesomeSlider',
      'linkedVaf.services',
      'linkedVaf.filters',
      'linkedVaf.forms',
      'linkedVaf.figures'
    ])
      .config(appConfig)
      .run(appRun);

  angular.module('linkedVaf.services', []);
  angular.module('linkedVaf.filters', []);
  angular.module('linkedVaf.figures', []);
  angular.module('linkedVaf.forms', []);

  // @ngInject
  function appConfig($urlRouterProvider) {
    $urlRouterProvider.otherwise('linkedVaf');
  }

  // @ngInject
  function appRun($rootScope) {
    console.log('appRun called.');
    /*  ui-router debug logging */
    function message(to, toP, from, fromP) {
      return from.name + angular.toJson(fromP) + ' -> ' + to.name + angular.toJson(toP);
    }

    $rootScope.$on('$stateChangeStart', function (evt, to, toP, from, fromP) {
      console.log('Start:   ' + message(to, toP, from, fromP));
    });
    $rootScope.$on('$stateChangeSuccess', function (evt, to, toP, from, fromP) {
      console.log('Success: ' + message(to, toP, from, fromP));
    });
    $rootScope.$on('$stateChangeError', function (evt, to, toP, from, fromP, err) {
      console.error('Error:   ' + message(to, toP, from, fromP), err);
    });
  }
})();
