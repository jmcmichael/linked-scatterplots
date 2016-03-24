(function() {
  'use strict';
  angular.module('linkedVaf.filters')
    .filter('ifEmpty', ifEmpty);

  // @ngInject
  function ifEmpty() {
    return function(input, defaultValue) {
      if (angular.isUndefined(input) || input === null || input === '') {
        return defaultValue;
      }
      return input;
    };
  }

})();
