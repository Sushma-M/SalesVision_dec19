/*global WM,_,google,Application*/

Application.$controller('GooglemapsController', ['$scope', 'Utils', '$element', 'NgMap', '$timeout', '$http', 'wmToaster', 'CONSTANTS', '$compile',
    function ($s, Utils, $el, NgMap, $timeout, $http, wmToaster, CONSTANTS, $compile) {
        'use strict';
        var prefabScope,
            _locations = [],
            _icon = '',
            _lat  = '',
            _lng  = '',
            latSum      = 0,
            lngSum      = 0,
            latNaNCount = 0,
            lngNaNCount = 0,
            markerIndex = 0,
            infoWindow,
            customMarker,
            customMarkers       = [],
            defaultCenter       = 'current-position',
            _oldBoundLocations  = -1,
            _buildMap,
            _updateDirections,
            _refreshMap,
            _deregisterFns = {'directions': _.noop},
            invalidMarker  = 0,
            heatmap,
            heatmapHidden = false,
            _checkMapStatus;
        $s.isMapLoading     = true;
        $s.heatmapData      = [];
        $s.maps             = [];
        $s.markersData      = [];
        $s.directionsData   = [];
        $s.onMapLoad        = _refreshMap; //needed whenever the performance is too low on browser.
        //sets the heat map layer properties
        function assignHeatMapLayers() {
            heatmap = _.get($s, 'maps[0].heatmapLayers.heatmapLayer');
        }
        //returns the LatLng Object required for mapping the markers
        function constructLatLngObject(lat, lng) {
            if (google) {
                return new google.maps.LatLng(lat, lng);
            }
        }

        function markLatLng(lat, lng, markerId) { //points the marker based on lat & lng
            if (!$s.maps[0] && (!_lat || !_lng)) {
                return;
            }
            if (isNaN(lat) || isNaN(lng)) {
                return;
            }
            //remove the previous marker only if the markerId is not provided
            clearNoIdMarker();
            var latlngObj = constructLatLngObject(lat, lng);
            customMarker = new google.maps.Marker({
                'position'  : latlngObj,
                'map'       : $s.maps[0],
                'draggable' : true,
                'animation' : google.maps.Animation.DROP
            });
            $s.maps[0].panTo(latlngObj);
            if (markerId) {
                customMarker.$$id = markerId.toString();
            }
            customMarkers.push(customMarker);
        }

        function markAddress(address, markerId) {//points the marker based on address , can also be used when lat&lng is in the same string
            var baseUrl,
                results,
                geometryLocations;
            if (!address) {
                return;
            }
            baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
            $http.get(baseUrl + address).then(function (response) {
                results = response.data.results[0];
                if (!results) {
                    return;
                }
                geometryLocations = results.geometry.location;
                markLatLng(geometryLocations.lat, geometryLocations.lng, markerId);
            });
        }

        function _removeMarkers(markerArray) { //removes all the markers if the markerArray is not passed
            if (!markerArray) {
                _.forEach(customMarkers, function (marker) {
                    marker.setMap(null);
                    marker = null;
                });
                customMarkers = [];
            } else {
                _.forEach(customMarkers, function (marker, index) {
                    if (marker) {
                        if (_.includes(markerArray, marker.$$id.toString())) {
                            marker.setMap(null);
                            marker = null;
                            customMarkers.splice(index, 1);
                        }
                    }
                });
            }
        }

        function clearNoIdMarker() {
            _.forEach(customMarkers, function (marker, index) {
                if (marker) {
                    if (!marker.$$id) {
                        marker.setMap(null);
                        marker = null;
                        customMarkers.splice(index, 1);
                    }
                }
            });
        }

        $s.clearMarkers = _removeMarkers;

        function removeMarker(markerIds) { //removes the marker placed based on marker Id
            var markerArray = [];
            if (!markerIds) {
                return;
            }
            if (WM.isObject(markerIds) || WM.isArray(markerIds)) {
                markerArray = markerIds;
                _removeMarkers(markerArray);
            } else {
                markerArray.push(markerIds);
                _removeMarkers(markerArray);
            }
        }

        function prepareLatLngData(lat, lng) {
            var latlng;
            if (lat && lng) {
                latlng = '[' + lat + ', ' + lng + ']';
            }
            if (isNaN(lat) || lat === null || lat === '') {
                latNaNCount++;
            } else {
                latSum += Number(lat);
            }
            if (isNaN(lng) || lng === null || lng === '') {
                lngNaNCount++;
            } else {
                lngSum += Number(lng);
            }
            return latlng;
        }

        function setCenter() { //based on the locations binded, sets the center of the map
            var len = $s.maptype === 'Markers' ? $s.markersData.length : $s.heatmapData.length,
                lat = latSum / (len - latNaNCount),
                lng = lngSum / (len - lngNaNCount);
            if (!len) {
                return;
            }
            $s.center = (len === latNaNCount || len === lngNaNCount) ? '[0,0]' : '[' + lat + ', ' + lng + ']';
            $s.centerData = {
                'lat': lat,
                'lng': lng
            };
            _refreshMap();
        }

        function alterMarkersObject(responseLatLng) {        //alter the already prepared marker object's latlng property
            if ($s.markersData[markerIndex]) {
                $s.markersData[markerIndex].latlng = responseLatLng;
                markerIndex++;
            }
            if (markerIndex >= $s.markersData.length) {
                setCenter();
            }
        }

        function getLatLng(address) {               //this function fetches the lat and lng and constructs the marker Object
            var lat, lng;
            if (!address) {
                invalidMarker++;
                return;
            }
            $http.get('https://maps.googleapis.com/maps/api/geocode/json?address=' + address).then(function (response) {
                var resultdataSet = response.data.results[0],
                    geometryLocations,
                    latlng;
                if (resultdataSet) {
                    geometryLocations = resultdataSet.geometry.location;
                    lat     = geometryLocations.lat;
                    lng     = geometryLocations.lng;
                    latlng  = prepareLatLngData(lat, lng);
                    alterMarkersObject(latlng);
                } else {
                    invalidMarker++;
                }
            });
        }
        //selects the activeMarker based on markerindex
        function assignActiveMarker(p) {
            _.forEach(_locations, function (marker) {
                if (marker.markerIndex === p.markerIndex) {
                    prefabScope.activeMarker = marker;
                    return false;
                }
            });
        }

        $s.onMarkerHover = function (event, p) {
            assignActiveMarker(p);
            Utils.triggerFn($s.onMarkerhover, {$isolateScope: $s});
        };

        $s.onMarkerClick = function (event, p) {
            Utils.triggerFn($s.onMarkerclick, {$isolateScope: $s});
            $s.showInfoWindow(event, p);
        };

        $s.showInfoWindow = function (event, p) { //opens the info-window specific to the marker , fixes the bug 'info-window' directive fails to load the info
            if (!($s.info || $s.setInfoWindow) || !google || !p.latlng) {
                return;
            }
            var content = '',
                latlngData = p.latlng.replace(/\[|\]/g, '').split(','),
                center = constructLatLngObject(latlngData[0], latlngData[1]);
            if (infoWindow) { //close other info windows if they're open
                infoWindow.close();
            }
            if ($s.setInfoWindow) {
                content = $compile('<div>' + Utils.triggerFn($s.setInfoWindow) + '</div>')($s.$new())[0].outerHTML;
            } else {
                content = '<div><p>' + p.information + '</p></div>';
            }
            infoWindow = new google.maps.InfoWindow({
                'content': content,
                'pixelOffset': new google.maps.Size(0, -30)
            });
            infoWindow.setPosition(center);
            infoWindow.open($s.maps[0]);
        };

        //resets the map and when the binded dataset is empty, sets the defaultCenter
        function resetMap(dataset) {
            markerIndex = latSum = lngSum = latNaNCount = lngNaNCount = 0;
            $s.heatmapData.length = 0;
            $s.markersData.length = 0;
            assignHeatMapLayers();
            if (heatmap) {
                heatmap.setMap(heatmap.getMap() ? null : $s.maps[0]);
                heatmapHidden = true;
            }
            if (!dataset) {
                $s.center     = '[0,0]';
                $s.centerData = {
                    lat: 0,
                    lng: 0
                };
                _refreshMap();
                return false;
            }
            return true;
        }
        //constructs the marker object
        function constructMarkersModel() {
            var lat,
                lng,
                latlng,
                address     = '',
                markerIndex = 0;
            if (!resetMap(_locations)) {
                return;
            }
            _.forEach(_locations, function(marker, index) {
                if (marker === null || !marker) {
                    return;
                }
                marker.markerIndex = markerIndex;
                if ($s.markertype === 'Address') {
                    if (!$s.address) {
                        return;
                    }
                    $s.addressData = $s.address.split(' ');
                    _.forEach($s.addressData, function(addrValue, index) {
                        addrValue = Utils.findValueOf(marker, $s.addressData[index]) + ' ';
                        address += addrValue || '';
                    });
                    getLatLng(address);
                    address = '';
                } else {
                    lat = Utils.findValueOf(marker, _lat);
                    lng = Utils.findValueOf(marker, _lng);
                    if (!lat || !lng) {
                        return;
                    }
                    latlng = prepareLatLngData(lat, lng);
                }
                $s.markersData.push({
                    'latlng'        : latlng,
                    'iconData'      : _icon ? Utils.findValueOf(marker, _icon) : '',
                    'information'   : $s.info ? Utils.findValueOf(marker, $s.info) : '',
                    'id'            : $s.$id + '_' + index,
                    'color'         : $s.shade ? Utils.findValueOf(marker, $s.shade) : '',
                    'radius'        : $s.radius ? Utils.findValueOf(marker, $s.radius) : '',
                    'markerIndex'   : markerIndex
                });
                markerIndex++;
            });
        }

        function buildMap() {
            if ($s.maptype !== 'Markers') {
                return;
            }
            var address = '',
                paramsExists;
            if (_locations) {
                paramsExists = $s.address ? true : (!(!_lat || !_lng));
                if (!paramsExists) {
                    return;
                }
                if (!$s.address) {
                    constructMarkersModel();
                    setCenter();
                } else {
                    constructMarkersModel();
                }
            } else {
                $s.center = defaultCenter;
            }
        }

        _buildMap = _.debounce(buildMap, 50);

        function onMarkerTypeChange(newVal) {
            var wp = $s.widgetProps;
            if (newVal === 'Address') {
                wp.address.show = true;
                wp.lat.show = wp.lng.show = false;
                $s.$root.$emit('set-markup-attr', $s.$parent.widgetid, {
                    'lat': '',
                    'lng': ''
                });
            } else if (newVal === 'LatLng') {
                wp.address.show = false;
                wp.lat.show = wp.lng.show = true;
                $s.$root.$emit('set-markup-attr', $s.$parent.widgetid, {
                    'address': ''
                });
            }
        }

        function assignLocations(dataset, options, columns, wp) {
            var TypeUtils;

            dataset    = WM.copy(dataset);
            _locations = [];

            if (WM.isArray(dataset)) {
                _locations = dataset;
            } else {
                if (WM.isObject(dataset) && WM.isArray(dataset.data) && !_.isEmpty(dataset.data)) {
                    _locations = dataset.data;
                } else {
                    _locations = dataset ? [dataset] : [];
                }
            }

            if ($s.widgetid) {

                TypeUtils = Utils.getService('TypeUtils');
                columns   = TypeUtils.getFieldsForExpr($s.bindlocations);
                options   = [''];

                wp.lat.options      = options;
                wp.lng.options      = options;
                wp.icon.options     = options;
                wp.info.options     = options;
                wp.shade.options    = options;
                wp.radius.options   = options;
                wp.address.options  = options;

                if (columns.length > 0) {
                    _.forEach(columns, function(key) {
                        options.push(key);
                    });
                } else if (_locations.length > 0) {
                    _.forEach(_locations[0], function(val, key) {
                        options.push(key);
                    });
                }
            }
        }

        function onLocationsChange(newVal) {

            var markerObj,
                wp = $s.widgetProps,
                columns = [],
                options;
            //assign the locations and options
            assignLocations(newVal, options, columns, wp);

            if ($s.widgetid) {

                if ((_oldBoundLocations !== -1) && (_oldBoundLocations !== $s.bindlocations)) {
                    /*Remove the attributes from the markup*/
                    $s.$root.$emit('set-markup-attr', $s.$parent.widgetid, {
                        'lat'       : '',
                        'lng'       : '',
                        'icon'      : '',
                        'info'      : '',
                        'shade'     : '',
                        'radius'    : '',
                        'address'   : ''
                    });
                    $s.lat        = '';
                    $s.lng        = '';
                    $s.icon       = '';
                    $s.info       = '';
                    $s.shade      = '';
                    $s.radius     = '';
                    $s.address    = '';

                    _oldBoundLocations = $s.bindlocations;
                }

                if (_oldBoundLocations === -1) {
                    _oldBoundLocations = $s.bindlocations;
                }
            }

            _buildMap();
        }

        function updateDirections() {
            if ($s.origin && $s.destination) {
                Utils.triggerFn(_deregisterFns.directions);

                //watch for the directions
                _deregisterFns.directions = $s.$watch(':: maps[0].directionsRenderers[0]', function(nv) {
                    //if there are no directions return back. nv is undefined between page navigation in studio mode
                    if (!nv) {
                        return;
                    }
                    if (nv.directions) {
                        var routeDetails;
                        routeDetails = nv.directions.routes[0].legs[0];
                        $s.distance  = routeDetails.distance.text;
                        $s.duration  = routeDetails.duration.text;
                    }
                });
            }
        }

        _updateDirections = _.debounce(updateDirections, 50);

        function prepareWayPoints(wayPointsObj) {
            if ($s.waypoints) {
                var newWayPoints = [],
                    showStopOver;
                if (WM.isArray($s.waypoints)) {
                    $s.directionsData.wayPoints = [];
                    showStopOver = true;
                    if (wayPointsObj) {
                        _.forEach(wayPointsObj, function(wayPoint) {
                            wayPoint.stopover = $s.stopover;
                            newWayPoints.push(wayPoint);
                        });
                        $s.directionsData.wayPoints = newWayPoints;
                    }
                } else if (WM.isString($s.waypoints) && CONSTANTS.isStudioMode) {
                    showStopOver = false;
                    wmToaster.warn('Waypoints bound cannot be of string type, Please refer documentation for more details');
                }
                $s.widgetProps.stopover.show = showStopOver;
            }
        }
        //prepare the params necessary for the heat map
        function prepareHeatMapData(newVal) {
            var wp = $s.widgetProps,
                columns = [],
                options;
            if (!resetMap(newVal)) { //if newVal is empty then reset the map and return
                return;
            }
            assignLocations(newVal, options, columns, wp);
            //if lat lng properties are not assigned do not construct the heatmap model
            if (!_lat || !_lng) {
                return;
            }
            _.forEach(_locations, function(location) {
                if (location === null || !location) {
                    return;
                }
                var loc = {};
                loc.latitude    = Utils.findValueOf(location, _lat);
                loc.longitude   = Utils.findValueOf(location, _lng);
                if (!loc.latitude || !loc.longitude) {
                    return;
                }
                prepareLatLngData(loc.latitude, loc.longitude);
                $s.heatmapData.push(constructLatLngObject(loc.latitude, loc.longitude));
            });
            $s.isHeatMapDataReady = true;
            setCenter();
            assignHeatMapLayers();
            if (heatmapHidden && heatmap) {
                heatmap.setMap($s.maps[0]);
                heatmapHidden = false;
            }
        }
        function changeMapType(type) {
            if (type === 'Markers') {
                onLocationsChange($s.locations);
            } else if (type === 'Heatmap') {
                prepareHeatMapData($s.locations);
            }
        }
        //depending on map type set the paramters and other properties
        function mapTypeOperations(newVal) {
            if ($s.widgetid) {
                var wp = $s.widgetProps,
                    markerProps  = ['onMarkerclick', 'onMarkerhover', 'radius', 'shade', 'info', 'icon', 'markertype', 'locations', 'lat', 'lng'],
                    heatmapProps = ['locations', 'lat', 'lng', 'gradient', 'pixeldensity', 'opacity'],
                    routeProps   = ['origin', 'destination', 'trafficlayer', 'transitlayer', 'travelmode', 'waypoints', 'stopover'],
                    commonProps  = ['name', 'tabindex', 'maptype', 'zoom', 'height', 'width', 'show', 'animation', 'onLoad', 'onDestroy', 'accessroles', 'class', 'margin', 'active', 'debugurl', 'showindevice'],
                    maptypeProps;
                if (newVal === 'Markers') {
                    wp.lat.displayName = 'Marker Latitude';
                    wp.lng.displayName = 'Marker Longitude';
                    maptypeProps = markerProps;
                } else if (newVal === 'Heatmap') {
                    wp.lat.displayName = 'Latitude';
                    wp.lng.displayName = 'Longitude';
                    maptypeProps = heatmapProps;
                } else {
                    maptypeProps = routeProps;
                }
                _.forEach(wp, function(property, key){
                    if(_.includes(maptypeProps, key)) {
                        property.show = true;
                    } else if (!_.includes(commonProps, key)){
                        property.show = false;
                    }
                });
                //set the Address , LatLng properties based on maptype and location type
                if (newVal === 'Markers') {
                    if ($s.markertype === 'Address') {
                        wp.lat.show = wp.lng.show = false;
                        wp.address.show = true;
                    } else {
                        wp.address.show = false;
                        wp.lat.show = wp.lng.show = true;
                    }
                }
                if (newVal !== 'Route') {
                    resetMap();
                    $s.directionsData.length = 0;
                } else {
                    $s.markersData.length = 0;
                    $s.heatmapData.length = 0;
                }
            }
            changeMapType(newVal);
        }
        //handles the property value changes made to gradient,opacity, pixel density
        function handleHeatMapPropChanges(key, value) {
            assignHeatMapLayers();
            if (!key && heatmap) {
                heatmap.set('gradient', heatmap.get('gradient') ? null : $s.gradient);
                heatmap.set('opacity', heatmap.get('opacity') ? null : $s.opacity);
                heatmap.set('radius', heatmap.get('radius') ? null : $s.pixeldensity);
                return;
            }
            if (!heatmap || !value) {
                return;
            }
            if (key === 'pixeldensity') {
                key = 'radius';
            }
            heatmap.set(key, heatmap.get(key) ? null : value);
        }
        //on Location change prepare data based on map type
        function triggerLocationFn(dataset) {
            if ($s.maptype === 'Markers') {
                onLocationsChange(dataset);
            } else if ($s.maptype === 'Heatmap') {
                prepareHeatMapData(dataset);
            }
        }

        function triggerLatLngChanges() {
            if ($s.maptype === 'Markers') {
                _buildMap();
            } else if ($s.maptype === 'Heatmap') {
                prepareHeatMapData($s.locations);
            }
        }
        /* Define the property change handler. This function will be triggered when there is a change in the prefab property */
        function propertyChangeHandler(key, newVal) {
            switch (key) {
                case 'maptype':
                    mapTypeOperations(newVal);
                    break;
                case 'locations':
                    triggerLocationFn(newVal);
                    break;
                case 'gradient':
                case 'opacity':
                case 'pixeldensity':
                    handleHeatMapPropChanges(key, newVal);
                    break;
                case 'markertype':
                    onMarkerTypeChange(newVal);
                    break;
                case 'address':
                    _buildMap();
                    break;
                case 'lat':
                    _lat = newVal;
                    triggerLatLngChanges();
                    break;
                case 'lng':
                    _lng = newVal;
                    triggerLatLngChanges();
                    break;
                case 'icon':
                    _icon = newVal;
                    _buildMap();
                    break;
                case 'shade':
                case 'radius':
                    if ($s.widgetid) {
                        _buildMap();
                    }
                    break;
                case 'zoom':
                    if (!isNaN(newVal)) {
                        $s.zoom = newVal;
                    }
                    break;
                case 'origin':
                    if ($s.maptype === 'Route') {
                        $s.directionsData.origin = newVal;
                        _updateDirections();
                    }
                    break;
                case 'destination':
                    if ($s.maptype === 'Route') {
                        $s.directionsData.destination = newVal;
                        _updateDirections();
                    }
                    break;
                case 'waypoints':
                    prepareWayPoints(newVal);
                    $s.$parent.widgetProps.stopover.show = newVal ? true : false;
                    break;
                case 'travelmode':
                    $s.travelMode = newVal.toUpperCase();
                    break;
                case 'trafficlayer':
                    $s.trafficLayer = newVal;
                    break;
                case 'transitlayer':
                    $s.transitLayer = newVal;
                    break;
                case 'show':
                    if (newVal) {
                        $el.find('ng-map').css('height', $s.height);
                        _refreshMap();
                    }
                    break;
            }
        }

        function refresh() {
            //check if the maps object is formed and then refresh
            if (!$s.maps[0]) {
                return;
            }
            var mapData = $s.maps[0];
            //re-size the map whenever the map is loaded in any container like dialog, tabs or any hidden elements
            $timeout(function() {
                google.maps.event.trigger(mapData, 'resize');
                //check for the lat, lng values if they're NaN and they exist
                if ($s.centerData && (!(isNaN($s.centerData.lat) || isNaN($s.centerData.lng)))) {
                    mapData.panTo(constructLatLngObject($s.centerData.lat, $s.centerData.lng));
                }
            }, 100);
        }
        /* register the property change handler */
        $s.propertyManager.add($s.propertyManager.ACTIONS.CHANGE, propertyChangeHandler);

        _refreshMap = _.debounce(refresh, 80);
        //toggle the loader visibility based on the requirement
        function toggleLoader(visibility) {
            $timeout(function() {
                $s.isMapLoading = visibility;
            });
        }
        //checks if the map is back to the idle state by comparing the bounds i.e checking if the map tiles are loaded
        function checkMapStatus() {
            if ($s.maps[0].lastBounds == $s.maps[0].getBounds()) {
                toggleLoader(false);
            } else {
                $s.maps[0].lastBounds = $s.maps[0].getBounds();
                _checkMapStatus();
            }
        }

        _checkMapStatus = _.debounce(checkMapStatus, 500);

        $s.$on('mapInitialized', function (event, evtMap) {
            $s.maps.push(evtMap);
            $el.find('div[name=googlemapview]').css('z-index', '15'); //over-rides the prefab default z-index //needed when the search widget is on top of the map, results are overlapped by map
            handleHeatMapPropChanges();
            _refreshMap(); //now call the refresh method to resize map, needed when the map is inside the dialogs or any other hidden element
            //add event listener to enable the spinner when an operation is performed on maps
            google.maps.event.addListener(evtMap, 'bounds_changed', function() {
                toggleLoader(true);
                _checkMapStatus();
            });
            //hide the spinner when the map comes back to the idle state.
            google.maps.event.addListener(evtMap, 'idle', function() {
                evtMap.lastBounds = evtMap.getBounds();
                toggleLoader(false);
            });
            /*Necessary in order to set the map to idle state as adding heat map is only a layer
              but not the operation on the map.
            */
            if ($s.maptype === 'Heatmap') {
                evtMap.setZoom(evtMap.zoom - 1);
            }
            _checkMapStatus();
        });

        $s.$on('$destroy', function (){
            assignHeatMapLayers();
            if (heatmap) {
                heatmap.setMap(null);
            }
            $el.remove(); //clears the element and the references created by google to draw the map (as a fix for IE)
            //clear all the created event listeners / heatmap instance if any existed
            if (!$s.map) {
                return;
            }
            /* add this method when loader for data input is done
               google.maps.event.clearInstanceListeners($s.map);
            */
            $s.map.heatmapLayer = undefined;
        });
        $s.refresh                  = _refreshMap;
        prefabScope                 = $el.closest('.app-prefab').isolateScope();
        prefabScope.redraw          = _refreshMap;
        prefabScope.markLatLng      = markLatLng;
        prefabScope.markAddress     = markAddress;
        prefabScope.removeMarker    = removeMarker;
        prefabScope.clearAllMarkers = _removeMarkers;
        prefabScope.showInfoWindow  = $s.showInfoWindow;
    }]);