Application.$controller("CustomerRepoTestPageController", ["$scope", function($scope) {
    "use strict";

    /* perform any action with the variables inside this block(on-page-load) */
    $scope.onPageVariablesReady = function() {
        /*
         * variables can be accessed through '$scope.Variables' property here
         * e.g. $scope.Variables.staticVariable1.getData()
         */
    };

    /* perform any action with widgets inside this block */
    $scope.onPageReady = function() {
        /*
         * widgets can be accessed through '$scope.Widgets' property here
         * e.g. $scope.Widgets.byId(), $scope.Widgets.byName()or access widgets by $scope.Widgets.widgetName
         */
    };

}]);


Application.$controller("grid1Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;

        $scope.pushIntoSP = function(id, name) {
            var customerdata = {
                "Title": "" + id,
                "CustomerName": name
            };
            $scope.Variables.Sp_insert_customer_repo_listInvoke.setInput('RequestBody', customerdata);
            $scope.Variables.Sp_insert_customer_repo_listInvoke.update();
        }
    }
]);