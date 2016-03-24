(function() {
  'use strict';
  angular.module('linkedVaf.services')
    .factory('_', function ($window) {
      return $window._;
    });
})();
