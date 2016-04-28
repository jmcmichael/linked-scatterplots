(function () {
  'use strict';
  //This is the basic entry point of the application
  angular.module('pancan2App', [
      'hc.dsv',
      'linkedVaf.services',
      'linkedVaf.filters',
      'linkedVaf.forms',
      'linkedVaf.figures',
      'formly',
      'formlyBootstrap',
      'ui.bootstrap',
      'ui.grid.autoResize',
      'ui.grid.pagination',
      'ui.grid.selection',
      'ui.grid.edit',
      'ui.grid.rowEdit'
    ])
    .run(appRun);

  angular.module('linkedVaf.services', []);
  angular.module('linkedVaf.filters', []);
  angular.module('linkedVaf.figures', []);
  angular.module('linkedVaf.forms', []);


  // @ngInject
  function appRun($rootScope, formlyConfig) {
    formlyConfig.setType({
      name: 'ui-grid',
      template: '<div ui-grid="{ data: model[options.key], columnDefs: to.columnDefs, onRegisterApi: to.onRegisterApi}" ui-grid-auto-resize ui-grid-pagination ui-grid-selection ui-grid-edit ui-grid-row-edit ></div>',
      wrapper: ['bootstrapLabel', 'bootstrapHasError']
    });
  }
})();
