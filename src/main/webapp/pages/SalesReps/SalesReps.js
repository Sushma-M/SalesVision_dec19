Application.$controller("SalesRepsPageController", ["$scope",
    function($scope) {
        "use strict";

        var allTasks;

        $scope.SalesdbRepsDataonSuccess = function(variable, data) {
            $scope.Widgets.livelist1.selecteditem = data[0];
            setTimeout(function() {
                $('.reps-list li:first').addClass('active');
            }, 10);
        };


        $scope.allTasksForAReponSuccess = function(variable, data) {
            data && data.forEach(function(task) {
                task.done = task.done ? "Done" : "Pending";
            });
            allTasks = WM.copy(data);
        };

        $scope.filterGrid = function(status) {
            if (!status) {
                $scope.Variables.allTasksForARep.dataSet.data = allTasks;
            } else {
                $scope.Variables.allTasksForARep.dataSet.data = allTasks.filter(function(task) {
                    return task.done == status;
                });
            }
            $scope.Widgets.grid3.dataset = $scope.Variables.allTasksForARep.dataSet
        };

        $scope.$root.updateTaskVariable = function() {
            $scope.Variables.allTasksForARep.update();
        }
    }
]);

Application.$controller("livelist1Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;
    }
]);



Application.$controller("grid2Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;
    }
]);



Application.$controller("grid3Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;
    }
]);

Application.$controller("dialog1Controller", ["$scope", "$http", "DialogService",
    function($scope, $http, DialogService) {
        "use strict";
        $scope.ctrlScope = $scope;
        $scope.insertTask = function() {
            $http.post('./services/salesdb/Tasks/', {
                "duedate": $scope.Widgets.dueDate.datavalue,
                "description": $scope.Widgets.desc.datavalue,
                "done": !!$scope.Widgets.isDone.datavalue,
                "reps": $scope.Widgets.livelist1.selecteditem
            }).success(function() {
                $scope.$root.updateTaskVariable();
                DialogService.hideDialog('dialog1');
            })
        };

        $scope.cancelDialog = function() {
            DialogService.hideDialog('dialog1');
        }

    }
]);

Application.$controller("liveform2Controller", ["$scope",
    function($scope) {
        "use strict";
        $scope.ctrlScope = $scope;
    }
]);