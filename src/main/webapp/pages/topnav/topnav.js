Application.$controller("topnavPageController", ["$scope", "$location",
    function($scope, $location) {
        "use strict";

        $scope.pagename = $location.$$path.split('/').pop();
    }
]);