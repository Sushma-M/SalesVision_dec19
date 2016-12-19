Application.$controller("SalesForceController", ["$scope", "Widgets", "Variables", "CONSTANTS",
    function($scope, Widgets, Variables, CONSTANTS) {
        "use strict";

        $scope.onPageVariablesReady = function() {}

        function getSalesForceData() {
            if (CONSTANTS.isRunMode &&
                !isBindExpr(Variables.OAuthToken.dataBinding.userName) &&
                !isBindExpr(Variables.OAuthToken.dataBinding.password) &&
                !isBindExpr(Variables.OAuthToken.dataBinding.clientId) &&
                !isBindExpr(Variables.OAuthToken.dataBinding.clientSecret) &&
                !isBindExpr(Variables.SalesForceAPIExecuteQuery.dataBinding.query)) {
                Variables.call("getData", "OAuthToken", {
                    scope: $scope
                }, function(data) {
                    Variables.SalesForceAPIExecuteQuery.dataBinding.accessToken = data.result.access_token;
                    Variables.SalesForceAPIExecuteQuery.dataBinding.endPointUrl = data.result.instance_url;
                    Variables.call("getData", "SalesForceAPIExecuteQuery", {
                        scope: $scope
                    }, function(data) {
                        $scope.result = data.result;
                    });
                });
            }
        }

        function isBindExpr(expr) {
            return !expr || expr.indexOf("bind:") === 0;
        }

        /* Define the property change handler. This function will be triggered when there is a change in the prefab property */
        function propertyChangeHandler(key, newVal) {
            //         switch (key) {
            //             case "username":
            //                 Variables.OAuthToken.dataBinding.userName = newVal;
            // 	getSalesForceData();
            //                 break;
            //             case "password":
            //                 Variables.OAuthToken.dataBinding.password = newVal;
            // 	getSalesForceData();
            //                 break;
            //             case "clientid":
            //                 Variables.OAuthToken.dataBinding.clientId = newVal;
            // 	getSalesForceData();
            //                 break;
            //             case "clientsecret":
            //                 Variables.OAuthToken.dataBinding.clientSecret = newVal;
            // 	getSalesForceData();
            //                 break;
            //             case "query":				
            //                 Variables.SalesForceAPIExecuteQuery.dataBinding.query = newVal;
            // 	getSalesForceData();
            // 	if(CONSTANTS.isStudioMode && newVal) {
            // 		/*to get all the field values of the query result */
            // 		var match = newVal.match(/select(.*)from/i);
            // 		$scope.result = {};
            // 		(match && match[1].split(',')).forEach(function (a) {$scope.result[a.trim()] = "";});						
            // 	}
            //                 break;
            //         }
        }

        /* register the property change handler */
        $scope.propertyManager.add($scope.propertyManager.ACTIONS.CHANGE, propertyChangeHandler);

        /*hide the prefab in run mode*/
        if (CONSTANTS.isRunMode) {
            $scope.show = false;
            $scope.height = 0;
        }

        $scope.SalesForceAPIExecuteQueryonResult = function(variable, data) {

        };

        $scope.SalesForceAPIExecuteQueryonSuccess = function(variable, data) {

        };

    }
]);