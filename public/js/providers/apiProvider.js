
angular.module('core').provider('api', function () {
    var apiBaseRoute = '';
    var _statusEvents = {};
    this.setBaseRoute = function (url) {
        apiBaseRoute = url;
    };
    this.setStatusEvent = function(statusCode, fn){
        _statusEvents['code' + statusCode.toString()] = fn;
    }
    /* ####  INSTANTIATE OBJECT  ###### */
    this.$get = ['$q', '$http', function ($q, $http) {
        var baseRoute = apiBaseRoute;
        var statusEvents = _statusEvents;
        /* ####  PROVIDER FUNCTIONS  ###### */
        function ApiProvider(config) {
            var configuration = config;
            var baseUrl = baseRoute + configuration.endPoint + '/';

            var _cached = {};

            var Cache = function () {
                this.Items = {}
                this.Set = function (key, obj) {
                    this.Items[this.getName(key)] = obj;
                }
                this.Get = function (key) {
                    return this.Items[this.getName(key)];
                }
                this.getName = function (key) {
                    return 'CACHE:' + key;
                }
                this.Exists = function (key) {
                    return this.Items[this.getName(key)] !== undefined;
                }
                return this;
            }

            var _cache = new Cache();

            // Object wraps promise and during http calls
            var Reference = function (cache, url) {
                var deferred = $q.defer();
                var result;
                var _url = url;
                
                if (cache) {
                    _cache.Set(url, deferred.promise);
                }
                return {
                    OnError: function (data, status, headers, config) {
                        console.log(status);
                        var _data = { data: data, status: status, headers: headers, config: config };
                        if(statusEvents['code' + status]) statusEvents['code' + status](_data);
                        if (configuration.onError && typeof configuration.onError == 'function'){
                            _data = configuration['onError'](_data);
                        } else {
                            _data.data = null;
                        }
                        deferred.resolve(_data);
                    },
                    Fill: function (data, status, headers, config) {
                        var _data = { data: data, status: status, headers: headers, config: config };
                        if (statusEvents['code' + _data.status.toString()]) {
                            statusEvents['code' + _data.status.toString()](_data);
                        }
                        if (configuration.after && typeof (configuration.after) == 'function') {
                            _data = configuration['after'](_data);
                        }
                        deferred.resolve(_data);
                    },
                    Before: function (data) {
                        if (configuration.before && typeof (configuration.before) == 'function') {
                            return configuration['before'](data);
                        } else {
                            return data;
                        }
                    },
                    Promise: deferred.promise,
                    Result: function () {
                        return result;
                    }
                };
            };
            function toTwoSigFig(val) {
                return val < 10 ? '0' + val : val;
            }
            function toQueryString(obj) {
                var result = '';
                var first = true;
                for (key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (first) {
                            result += '?';
                            first = false;
                        } else {
                            result += '&';
                        }
                        // intercept dates to allow global formatting approach
                        if (obj[key] instanceof Date) {

                            var dt = obj[key];
                            obj[key] = dt.getFullYear() + '-' + toTwoSigFig(dt.getMonth() + 1) + '-' + toTwoSigFig(dt.getDate());
                        }
                        result = result + key + '=' + escape(obj[key]);
                    }
                }
                return result;
            }
            // PROVIDER PUBLIC FUNCTIONS
            return {
                // Caching support
                get: function (id, cache) {
                    var url = baseUrl + id;
                    if (cache && _cache.Exists(url)) {
                        return $q.all(_cache.Get(url));
                    } else {
                        var reference = new Reference(cache, url);
                        $http.get(url).success(reference.Fill).error(reference.OnError);
                        return reference.Promise;
                    }
                },
                query: function (query, cache) {
                    var url = baseUrl + (query ? toQueryString(query) : '');
                    if (cache && _cache.Exists(url)) {
                        return $q.all(_cache.Get(url));
                    } else {
                        var reference = new Reference(cache, url);
                        $http.get(url).success(reference.Fill).error(reference.OnError);
                        return reference.Promise;
                    }
                },
                fetch: function (id, query, cache) {
                    var url = baseUrl + id + (query ? toQueryString(query) : '');
                    if (cache && _cache.Exists(url)) {
                        return $q.all(_cache.Get(url));
                    } else {
                        var reference = new Reference(cache, url);
                        $http.get(url).success(reference.Fill).error(reference.OnError);
                        return reference.Promise;
                    }
                },
                patch: function (id, data) {
                    var url = baseUrl + id;
                    var reference = new Reference();
                    $http({ url: url, method: 'PATCH', data: data }).success(reference.Fill).error(reference.OnError);
                    return reference.Promise;
                },
                put: function (id, data) {
                    var url = baseUrl + id;
                    var reference = new Reference();
                    $http.put(url, data).success(reference.Fill).error(reference.OnError);
                    return reference.Promise;
                },
                post: function (data) {
                    var url = baseUrl;
                    var reference = new Reference();
                    $http.post(url, data).success(reference.Fill).error(reference.OnError);
                    return reference.Promise;
                },
                remove: function (id, data) {
                    var url = baseUrl + id + (data ? toQueryString(data) : '');
                    var reference = new Reference();
                    $http['delete'](url, data).success(reference.Fill).error(reference.OnError);
                    return reference.Promise;
                },
                querystringToObject : function (url) {
                        var qs = url.split('?');
                        if (!qs[1]) return {}
                        var arr = qs[1].split('&');
                        var obj = {};
                        for (var i = 0; i < arr.length; i++) {
                            var set = arr[i].split('=');
                            obj[set[0]] = set[1];
                        }
                        return obj;
                },
                objectToQueryString: toQueryString,
                endPoint : baseUrl
            }
        }
        return ApiProvider;
    }];
});

