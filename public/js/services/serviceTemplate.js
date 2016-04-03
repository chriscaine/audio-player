angular.module('core').factory('TemplateService', function ($http, $q) {
    // Service downloads and caches templates for the routing provider
    var _templatesTable = {};
    return {
        Get: function (templateUrl) {
            if (!_templatesTable[templateUrl]) {
                _templatesTable[templateUrl] = $http.get(templateUrl).then(function (data) {
                    // catch log out
                    if (data.status === 401) {
                        location.reload();
                    }
                    return data.data;
                });
            }
            return $q.all(_templatesTable[templateUrl]);
        }
    }
});