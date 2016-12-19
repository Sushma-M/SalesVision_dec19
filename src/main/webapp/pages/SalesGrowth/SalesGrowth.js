Application.$controller("SalesGrowthPageController", ["$scope",
    function($scope) {
        "use strict";

        var applyFilter = false;

        /* perform any action with the variables inside this block(on-page-load) */
        $scope.onPageVariablesReady = function() {
            /*
             * variables can be accessed through '$scope.Variables' service here
             * e.g. $scope.Variables.staticVariable1.getData()
             */
            if (applyFilter) {
                /*initialize filter*/
                $scope.filter();
            } else {
                applyFilter = true;
            }
        };

        /* perform any action with widgets inside this block */
        $scope.onPageReady = function() {
            /*
             * widgets can be accessed through '$scope.Widgets' service here
             * e.g. $scope.Widgets.byId(), $scope.Widgets.byName()or access widgets by $scope.Widgets.widgetName
             */
            if (applyFilter) {
                /*initialize filter*/
                $scope.filter();
            } else {
                applyFilter = true;
            }
        };

        $scope.filter = function() {
            var dataBinding = {
                channel: $scope.Widgets.leftpanel.Widgets.channelFilter && +$scope.Widgets.leftpanel.Widgets.channelFilter.datavalue || 2
            };

            $scope.Variables.leadsCount.dataBinding = dataBinding;
            $scope.Variables.repsCount.dataBinding = dataBinding;
            $scope.Variables.salesRevenueAndCount.dataBinding = dataBinding;
            $scope.Variables.salesByReps.dataBinding = dataBinding;
            $scope.Variables.leadsByChannels.dataBinding = dataBinding;

            $scope.Variables.leadsCount.update();
            $scope.Variables.repsCount.update();
            $scope.Variables.salesRevenueAndCount.update();
            $scope.Variables.salesByReps.update();
            $scope.Variables.leadsByChannels.update();
        };

        $scope.clear = function() {
            $scope.Widgets.leftpanel.Widgets.channelFilter && ($scope.Widgets.leftpanel.Widgets.channelFilter._model_ = "2");
            $scope.filter();
        }


        $scope.leadsByChannelsonBeforeDatasetReady = function(variable, data) {
            if (data.content.length === 0) {
                return [{
                    "Leads": 0,
                    "Week": 0
                }];
            } else {
                return data;
            }
        };

    }
]);

Application.$controller("grid1Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;
    }
]);