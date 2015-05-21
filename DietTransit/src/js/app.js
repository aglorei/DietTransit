var UI = require('ui');
var ajax = require('ajax');
var Vector2 = require('vector2');
var Accel = require('ui/accel');
var Vibe = require('ui/vibe');
var locationOptions = {
	enableHighAccuracy: true,
	maximumAge: 10000,
	timeout: 10000
};

// Show splash screen while waiting for data
var splashWindow = new UI.Window();

// Text element to inform user
var text = new UI.Text({
	position: new Vector2(0, 0),
	size: new Vector2(144, 168),
	text:'Downloading nearby routes...',
	font:'GOTHIC_28_BOLD',
	color:'black',
	textOverflow:'wrap',
	textAlign:'center',
	backgroundColor:'white'
});

// Add to splashWindow and show
splashWindow.add(text);
splashWindow.show();

// Make an asynchronous request
navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);

// on successful Geolocation API call, log coordinates and send ajax call
function locationSuccess(pos) {
	var latitude = pos.coords.latitude.toFixed(6);
	var longitude = pos.coords.longitude.toFixed(6);
	console.log('lat= ' + latitude + ' lon= ' + longitude);

	ajax(
		{
			url: 'http://api.pugetsound.onebusaway.org/api/where/stops-for-location.json?key=TEST&lat='+ latitude +'&lon='+ longitude +'&radius=500',
			type: 'json'
			// url: 'http://api.pugetsound.onebusaway.org/api/where/routes-for-location.xml?key=TEST&lat=47.653435&lon=-122.305641',
			// type: 'json'
		},
		function (data) {
			var routeData = data.data.references.routes;
			var routePage = 0;
			var totalPage = Math.floor(routeData.length / 10 % 10);

			// Parse data retrieved from API call
			var parseRoutes = function(routeData, startIndex) {
				var items = [];
				var endDistance = routeData.length - startIndex;
				var quantity = endDistance < 10 ? endDistance : 10;

				// Pagination for "previous" results
				if (startIndex > 9) {
					var prevPagination = paginationItem(startIndex - 9, startIndex, 'Previous');
					items.push(prevPagination);
				}

				// Pagination for "next" results
				if (endDistance > 9) {
					var nextPagination = paginationItem(startIndex + 11, Math.min(startIndex + 20, routeData.length), 'Next');
					items.push(nextPagination);
				}

				// Main results
				for (var i=startIndex; i<startIndex + quantity; i++) {
						var item = {
							// routeData index
							pathIndex: i,
							// Route number
							title: routeData[i].shortName,
							// Route description
							subtitle: routeData[i].description,
						};
						items.push(item);
				}

				return items;
			};

			// Create pagination item for Menu Window
			var paginationItem = function(startIndex, endIndex, string) {
				return {
					pathIndex: string,
					title: string + ' results',
					subtitle: startIndex + ' - ' + endIndex
				};
			};

			var routeSection = function(routeData, routePage, totalPage) {
				return {
					title: 'Nearby Routes (' + (routePage / 10 + 1) + '/' + (totalPage+1) +')',
					items: parseRoutes(routeData, routePage)
				};
			};

			// Construct Menu to show to user
			var resultsMenu = new UI.Menu({
				sections: [routeSection(routeData, routePage, totalPage)]
			});

			// Add SELECT actions for each resultsMenu item
			resultsMenu.on('select', function(e) {
				// Route specifics
				if (typeof e.item.pathIndex === 'number') {
					var detailCard = new UI.Card({
						title: e.item.title,
						subtitle: e.item.subtitle,
						body: routeData[e.item.pathIndex].id,
						style: 'small',
						scrollable: true
					});

					detailCard.show();
				// Paginate Prev
				} else if (e.item.pathIndex === 'Previous') {
					routePage -= 10;
					e.menu.section(0, routeSection(routeData, routePage, totalPage));
				// Paginate Next
				} else if (e.item.pathIndex === 'Next') {
					routePage += 10;
					e.menu.section(0, routeSection(routeData, routePage, totalPage));
				}
			});

			// Register for 'tap' events
			resultsMenu.on('accelTap', function(e) {
				resultsMenu.hide();
				resultsMenu.hide();
				splashWindow.show();

				// Make another asynchronous request
				navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);

				// Notify the user
				Vibe.vibrate('short');

				return true;
			});

			resultsMenu.show();
			splashWindow.hide();
		},
		function (error) {
			console.log("Download failed: " + error);
		}
	);
}

// on error, log error
function locationError(err) {
	console.log('location error (' + err.code + '): ' + err.message);
}

// Prepare the accelerometer
Accel.init();