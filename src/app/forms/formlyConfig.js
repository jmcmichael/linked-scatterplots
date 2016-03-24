(function() {
  'use strict';
  angular.module('linkedVaf.forms')
    .config(basicFieldTypesConfig);

  // @ngInject
  function basicFieldTypesConfig(formlyConfigProvider) {
    /*
     * BASIC FIELD TYPES
     */
    // colorpicker
    formlyConfigProvider.setType({
      name: 'colorpicker',
      wrapper: ['bootstrapLabel', 'bootstrapHasError'],
      templateUrl: 'forms/colorpicker.tpl.html'
    });

  }
})();
