angular.module('core').filter('artist', function () {
    return function (list, search) {
        var arr = [];
        if (search !== undefined && search.length > 0) {
            var regex = new RegExp(search, 'gi');
            for (var key in list) {
                if (regex.exec(key)) {
                    arr.push({ List: list[key], Name: key });
                }
            }
            return arr;
        }
        return [];
    }
});