(function() {
  'use strict';
  angular.module('linkedVaf.services')
    .factory('d3', function ($window) {
      return $window.d3;
    });
})();
