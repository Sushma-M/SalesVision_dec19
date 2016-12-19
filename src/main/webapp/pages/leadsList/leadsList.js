Application.$controller("leadsListPageController", ["$scope",
    function($scope) {
        "use strict";

        $scope.onLeadClick = function($event, $isolateScope) {
            $scope.Variables.selectedLead.dataSet = $isolateScope.item;
        }


    }
]);

Application.$controller("livelist1Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;
    }
]);