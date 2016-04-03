// the multi-view listens to events from the ovationRouteProvider and compiles the template and attaches the 
// associated controller for the associated view registered in the attribute i.e. <div ovation-multi-view="main"></div>
angular.module('core').directive("multiView", ['$rootScope', '$compile', '$controller', '$location', 'TemplateService', function ($rootScope, $compile, $controller, $location, TemplateService) {
    return {
        terminal: true,
        priority: 400,
        link: function ($scope, $element, attr) {
           
            var panel = attr.multiView;
            var loadingHtml = $('<div />', {'style':'padding:10%; text-align:center;'}).append($('<i />', {'class': 'icon-spinner icon-5x icon-spin', 'style': 'opacity:0.8;'}));
            var currentElement;
            var lastScope;
            var route;
       
            // method cleanly removes view
            var remove = function() {
                if (lastScope) {
                    lastScope.$destroy();
                    lastScope = null;
                }
                // IMPORTANT - use jQuery detach() to prevent browser crash in IE7
                $element.children().detach();
            }

            var render = function (route) {
                // clone the template on the route
                var clone = $(route.template);
                // add template to the directives $element object
                // remove old tempalte and store reference to new template
                remove();
                // if (currentElement) currentElement.remove();
                // currentElement = clone;
                $element.html(clone);
                // compile the contents template
                var link = $compile(clone.contents());
                var newController = route.controller; // as string
                // if route has a controller
                if (newController) {
                    lastScope = $scope.$new();
                    // create object with a new scope
                    var locals = { $scope: lastScope };
                    // instantiate controller with scope
                    var controller = $controller(newController, locals);
                    $element.children().data('$ngControllerController', newController);
                    link(lastScope);
                }
            }

            var update = function (route) {
                // find associated panel in the route
                route = route[panel];
                if (route) {
                    $element.html(loadingHtml);
                    // if route has template string load with this
                    if (route.template) {
                        render(route);
                        $rootScope.$broadcast('view:loaded', panel);
                    } else if (route.templateUrl) {
                        // else fetch the template
                        // should change this to use angulars template service
                        TemplateService.Get(route.templateUrl).then(function (templateHtml) {
                            route.template = templateHtml;
                            // render template
                            render(route);
                        });
                        $rootScope.$broadcast('view:loaded', panel);
                    }
                }
            }
            // listen for route changes
            $scope.$on('ovationRouteChange', function (evt, route) {
                // pass route data to update function
                update(route);
            });
            $scope.$on('page:animation:end', function(evt, incomingPanel) {
                if (panel !== incomingPanel) {
                    remove();
                }
            });
        }
    }
}]);
