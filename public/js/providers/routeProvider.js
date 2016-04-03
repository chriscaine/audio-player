angular.module('core').provider('route', function () {
    // Hash table to hold routes
    var RouteTable = {};
    // default value for route
    var defaultPath = '/';
    // returns an object containing the path [string with just the route item i.e. #/book/:id/:title returns 'book'] and array of data parameter names
    var getDataFromPath = function (path) {
        function pathRegExp(path, opts) {
            var insensitive = opts.caseInsensitiveMatch,
                ret = {
                    originalPath: path,
                    regexp: path
                },
                keys = ret.keys = [];

            path = path
              .replace(/([().])/g, '\\$1')
              .replace(/(\/)?:(\w+)([\?\*])?/g, function (_, slash, key, option) {
                  var optional = option === '?' ? option : null;
                  var star = option === '*' ? option : null;
                  keys.push({ name: key, optional: !!optional });
                  slash = slash || '';
                  return ''
                    + (optional ? '' : slash)
                    + '(?:'
                    + (optional ? slash : '')
                    + (star && '(.+?)' || '([^/]+)')
                    + (optional || '')
                    + ')'
                    + (optional || '');
              })
              .replace(/([\/$\*])/g, '\\$1');

            ret.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
            return ret;
        }

        var result = pathRegExp(path, {});
        if (path.charAt(0) === '/') path = path.substr(1);
        if (path.charAt(path.length - 1) === '/') path = path.substr(0, path.length - 1);

        path = path.split('/');
        result.path = '/' + path[0].toLowerCase();
        result.params = path.splice(1);
        return result;
    }

    var findFromPath = function (location) {
        function inherit(parent, extra) {
            return angular.extend(angular.copy(parent), extra);
        }

        function switchRouteMatcher(on, route) {
            var keys = route.keys,
                params = {};

            if (!route.regexp) return null;

            var m = route.regexp.exec(on);
            if (!m) return null;

            for (var i = 1, len = m.length; i < len; ++i) {
                var key = keys[i - 1];

                var val = m[i];

                if (key && val) {
                    params[key.name] = val;
                }
            }
            return params;
        }

        function parseRoute() {
            var params, match;
            angular.forEach(RouteTable, function (route, path) {
                if (!match && (params = switchRouteMatcher(location.path(), route))) {
                    match = inherit(route, {
                        params: angular.extend({}, location.search(), params),
                        pathParams: params
                    });
                    match.$$route = route;
                }
            });
            return match || false;
        }
        return parseRoute();
    }


    this.when = function (path, target, obj) {
        var route = getDataFromPath(path);
        if (!route) return;
        if (target) {
            route[target] = obj;
            if (obj.title) {
                route.title = obj.title;
            }
            if (obj.roles) {
                route.roles = obj.roles;
            }
        }
        // remove colon from the front of data names
        for (var i = 0; i < route.params.length; i += 1) {
            route.params[i] = route.params[i].replace(':', '');
        }

        // 16/01/2015  RouteTable[route.path] = route;
        RouteTable[path] = route;
        return 'Route Added';
    };

    this.otherwise = function (path) {
        defaultPath = path;
    }

    this.$get = ['$rootScope', '$location', 'routeParams', function ($rootScope, $location, routeParams) {
        // history
        var history = [];
        var _back = function () {
            var path = history.pop();
            $location.path(path);
        }

        var _lastPath = '';
        var _currentRoute;
        var _getDataFromPath = getDataFromPath;
        var _findFromPath = findFromPath;
        var _routeTable = RouteTable;
        var _defaultPath = defaultPath;
        var redirect = function () {
            if (_defaultPath == _lastPath) { $location.path(_defaultPath); } else {
                $location.path(_defaultPath);
                onLocationChange();
            }
        }
        var _currentRoute = {}

        var onLocationChange = function () {
            // find route based on path and return route object
            var route = _findFromPath($location);

            if (_routeTable[route.originalPath]) {
                // if no roles supplied or has authority on role - load route
                if (route.roles == undefined) {
                    // add new route to history
                    history.push($location.path());
                    angular.copy(route.pathParams, routeParams);
                    _currentRoute = route;
                    $rootScope.$broadcast('ovationRouteChange', route);
                    _lastPath = route.path;
                } else {
                    // no authority on route, go back
                    _back();
                }
            } else {
                redirect();
            }
        }

        $rootScope.$on('$locationChangeSuccess', function (e, obj) {
            onLocationChange();
        });
        return {
            Back: _back,
            Routes: _routeTable,
            // Returns an array of page links where pages are deemed public
            PublicRoutes: function () {
                var arr = [];
                for (var key in _routeTable) {
                    // add route if it contains no variables and has a title
                    if (_routeTable[key].title && key.indexOf(':') === -1) {
                        arr.push({ Title: _routeTable[key].title, Slug: key.replace(/^\//, '') });
                    }
                }
                return arr;
            }
        };
    }];
});

angular.module('core').provider('routeParams', function () {
    this.$get = function () {
        var _obj = {}
        return {
        };
    }
});




