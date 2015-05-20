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
var latitude = 47.6097;
var longitude = -122.3335;

// on successful Geolocation API call, log coordinates
function locationSuccess(pos) {
	latitude = pos.coords.latitude;
	longitude = pos.coords.longitude;
	console.log('lat= ' + latitude + ' lon= ' + longitude);
}

// on error, log error
function locationError(err) {
	console.log('location error (' + err.code + '): ' + err.message);
}

// Make an asynchronous request
navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);

// var parseFeed = function(data, quantity) {
// 	var items = [];
// 	for(var i = 0; i < quantity; i++) {
// 		// Always upper case the description string
// 		var title = data.list[i].weather[0].main;
// 		title = title.charAt(0).toUpperCase() + title.substring(1);

// 		// Get date/time substring
// 		var time = data.list[i].dt_txt;
// 		time = time.substring(time.indexOf('-') + 1, time.indexOf(':') + 3);

// 		// Add to menu items array
// 		items.push({
// 			title:title,
// 			subtitle:time
// 		});
// 	}

// 	// Finally return whole array
// 	return items;
// };

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

	// Pagination for "next" results
	if (endDistance > 9) {
		var nextPagination = paginationItem(startIndex + 11, Math.min(startIndex + 20, routeData.length), 'Next');
		items.push(nextPagination);
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
		title: 'Nearby Routes (' + (routePage % 10) + '/' + (totalPage+1) +')',
		items: parseRoutes(routeData, routePage)
	};
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

ajax(
	{
		url: 'http://api.pugetsound.onebusaway.org/api/where/stops-for-location.json?key=TEST&lat=47.612774&lon=-122.345207&radius=500',
		type: 'json'
	},
	function (data) {
		var routeData = data.data.references.routes;
		var routePage = 0;
		var totalPage = Math.floor(routeData.length / 10 % 10);

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

		resultsMenu.show();
		splashWindow.hide();
	},
	function (error) {
		console.log("Download failed: " + error);
	}
);

// // Make request to openweathermap.org
// ajax(
// 	{
// 		url:'http://api.openweathermap.org/data/2.5/forecast?q=London',
// 		type:'json'
// 	},
// 	function (data) {
// 		// Create an array of Menu items
// 		var menuItems = parseFeed(data, 10);

// 		// Construct Menu to show to user
// 		var resultsMenu = new UI.Menu({
// 			sections: [{
// 				title: 'Nearby Routes',
// 				items: menuItems
// 			}]
// 		});

// 		// Add an action for SELECT
// 		resultsMenu.on('select', function(e) {
// 			// Get that forecast
// 			var forecast = data.list[e.itemIndex];

// 			// Assemble body string
// 			var content = data.list[e.itemIndex].weather[0].description;

// 			// Capitalize first letter
// 			content = content.charAt(0).toUpperCase() + content.substring(1);

// 			// Add temperature, pressure etc
// 			content += '\nTemperature: ' + Math.round(forecast.main.temp - 273.15) + 'Â°C' + '\nPressure: ' + Math.round(forecast.main.pressure) + ' mbar' + '\nWind: ' + Math.round(forecast.wind.speed) + ' mph, ' + Math.round(forecast.wind.deg) + 'Â°';

// 			// Create the Card for detailed view
// 			var detailCard = new UI.Card({
// 				title:'Details',
// 				subtitle:e.item.subtitle,
// 				body: content
// 			});
// 			detailCard.show();
// 		});

// 		// Show the Menu, hide the splash
// 		resultsMenu.show();
// 		splashWindow.hide();

// 		// Register for 'tap' events
// 		resultsMenu.on('accelTap', function(e) {
// 			// Make another request to openweathermap.org
// 			ajax(
// 				{
// 					url:'http://api.openweathermap.org/data/2.5/forecast?q=London',
// 					type:'json'
// 				},
// 				function(data) {
// 					// Create an array of Menu items
// 					var newItems = parseFeed(data, 10);

// 					// Update the Menu's first section
// 					resultsMenu.items(0, newItems);

// 					// Notify the user
// 					Vibe.vibrate('short');
// 				},
// 				function(error) {
// 					console.log('Download failed: ' + error);
// 				}
// 			);
// 		});
// 	},
// 	function (error) {
// 		console.log("Download failed: " + error);
// 	}
// );

// Prepare the accelerometer
Accel.init();