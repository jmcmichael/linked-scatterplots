(function () {
  'use strict';
  //This is the basic entry point of the application
  angular.module('linkedVafs',
    [
      'hc.dsv',
      'linkedVaf.services',
      'linkedVaf.filters',
      'linkedVaf.forms',
      'linkedVaf.figures',
      'ui.bootstrap',
      'ui.grid.autoResize',
      'ui.grid.pagination',
      'ui.grid.selection',
      'ui.grid.edit',
      'ui.grid.rowEdit',
      'ui.grid.exporter'
    ])
    .run(appRun)
    .config(appConfig);

  angular.module('linkedVaf.services', []);
  angular.module('linkedVaf.filters', []);
  angular.module('linkedVaf.figures', []);
  angular.module('linkedVaf.forms', []);


  // @ngInject
  function appRun($rootScope) {
  }

  // @ngInject
  function appConfig($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
  }
})();
