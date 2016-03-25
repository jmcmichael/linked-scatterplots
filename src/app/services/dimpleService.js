(function() {
  'use strict';
  angular.module('linkedVaf.services')
    .factory('dimple', function ($window) {
      return $window.dimple;
    });
})();
