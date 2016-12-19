Application.$controller("CommonPageController", ['$scope',
    function($scope) {
        "use strict";

        /* perform any action with the variables inside this block(on-page-load) */
        $scope.onPageVariablesReady = function() {
            /*
             * variables can be accessed through '$scope.Variables' service here
             * e.g. $scope.Variables.staticVariable1.getData()
             */
        };

    }
]);

Application.$controller("CommonLoginDialogController", ["$scope", "DialogService",
    function($scope, DialogService) {
        "use strict";
        $scope.ctrlScope = $scope;

        $scope.CommonLoginDialogError = function($event, $isolateScope) {
            /*
             * Error message can be accessed from the property $isolateScope.errMsg
             */
        };

        $scope.CommonLoginDialogSuccess = function($event, $isolateScope) {
            DialogService.hideDialog("CommonLoginDialog");
        };
    }
]);