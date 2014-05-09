function Map() {
	var pub = {},
		map,
		markers = [],
		waypoints = [],
		directionsDisplay,
		directionsService = new google.maps.DirectionsService(),
		showMarkers = true,
		mapData = [];

	pub.init = function() {
		var options = {
			zoom: 8,
			center: new google.maps.LatLng(26.322610, -80.151743)
		};

		directionsDisplay = new google.maps.DirectionsRenderer();
		map = new google.maps.Map(document.getElementById('map'), options);
		directionsDisplay.setMap(map);

		getCoordinates();
	}

	function getCoordinates() {
		$.getJSON('/coords', function(data) {
			var marker,
				markerPos,
				markerBounds = new google.maps.LatLngBounds(),
				waypointInterval = Math.floor(data.length/8);

			mapData = data;

			for(var i=0; i<data.length; i++) {
				markerPos = new google.maps.LatLng(data[i].lat, data[i].lng);
				
				if(showMarkers) {
					marker = new google.maps.Marker({
					    position: markerPos,
					    map: map,
					    title: 'Position ' + i,
					    animation: google.maps.Animation.DROP
					});
					markers.push(marker);
					markerBounds.extend(markerPos);
				}

				if(i > 0 && i < (data.length - 1)) {
					if(i % waypointInterval === 0) {
						waypoints.push({
							location: markerPos,
							stopover: false
						});
					}
				}
			}

			createInfoWindows();
			map.fitBounds(markerBounds);
			setRoute(data);
		});
	}

	function createInfoWindows() {
		var infoWindow = [],
			contentString,
			openedWindow;

		for(var i=0, len=markers.length; i<len; i++) {
			contentString = 'Speed: ' + convertSpeed(mapData[i].speed, mapData[i].type) + ' mph <br />';
			contentString += 'Lat: ' + mapData[i].lat + '<br />';
			contentString += 'Lng: ' + mapData[i].lng;

			if(mapData[i].altitude) {
				contentString += '<br />Altitude: ' + metersToFeet(mapData[i].altitude) + 'ft';
			}

			infoWindow[i] = new google.maps.InfoWindow({
			    content: contentString
			});
			google.maps.event.addListener(markers[i], 'click', function(n) {
				return function() {
					if(openedWindow) {
						openedWindow.close();
					}

					infoWindow[n].open(map, markers[n]);
					openedWindow = infoWindow[n];
				}
			}(i));
		}
	}

	function setRoute(data) {
		if(waypoints.length > 8) {
			log('Too many waypoints! Let\'s fix that.');
			fixWaypoints();
		}

		var last = data.length - 1,
			request = {
				origin: new google.maps.LatLng(data[0].lat, data[0].lng),
				destination: new google.maps.LatLng(data[last].lat, data[last].lng),
				travelMode: google.maps.TravelMode.DRIVING,
				provideRouteAlternatives: false,
				waypoints: waypoints
			};

		directionsService.route(request, function(result, status) {
			log(status);
		    if (status == google.maps.DirectionsStatus.OK) {
		    	directionsDisplay.setDirections(result);
		    }
		});
	}

	function fixWaypoints() {
		var numToDelete = waypoints.length - 8,
			rand = 0;

		log('We have to go from ' + waypoints.length + ' to 8. Let\'s delete ' + numToDelete);

		for(var i=0; i<numToDelete; i++) {
			rand = Math.round(Math.random() * ((waypoints.length - 1) - 1) + 1);
			waypoints.splice(rand, 1);
		}

		log('We now have ' + waypoints.length + ' waypoints.');
	}

	function convertSpeed(speed, type) {
		return type == 'actioncam' ? Math.round(speed * 1.15077945) : Math.round(speed * 2.23694);
	}

	function metersToFeet(alt) {
		return Math.round(alt * 3.28084);
	}

	function log(msg) {
		if(console && console.log) console.log(msg);
	}

	return pub;
}

var map = new Map();
$(document).ready(map.init);