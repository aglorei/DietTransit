var express = require('express');
var randomstring = require('randomstring');
var Timeline = require('pebble-api');
var app = express();

// handler for GET '/'
app.get('/', function (request, response){
	response.send('Hello, World');
});

var timeline = new Timeline();

// handler for GET /senduserpin/:userToken/:minutesToAdd?
app.get('/senduserpin/:userToken/:minutesToAdd?', function (request, response){

	console.log('hereooo');

	var userToken = request.params.userToken;
	var minutesToAdd = request.params.minutesToAdd || 0;

	console.log('Got a request from ' + userToken + ' to send in a pin in ' + minutesToAdd + ' min');

	// generate random id
	var id = randomstring.generate(64);

	var now = new Date();

	// create the pin object
	var pin = new Timeline.Pin({
		id: id,
		time: new Date(now.getTime() + (minutesToAdd*60*1000)),
		layout: {
			type: Timeline.Pin.LayoutType.GENERIC_PIN,
			tinyIcon: Timeline.Pin.Icon.PIN,
			title: 'This is a generic pin!',
			body: 'Pin ID: ' + id
		}
	});

	// add actions to the pin
	[10, 20, 30].forEach(function (min){
		pin.addAction(new Timeline.Pin.Action({
			type: Timeline.Pin.ActionType.OPEN_WATCHAPP,
			title: min + ' min',
			launchCode: min
		}));
	});

	// send the pin
	timeline.sendUserPin(userToken, pin, function (error, body, response){
		if (error){
			return console.log(error);
		}

		response.send('Status Code: ' + resp.statusCode);
	});
});

var port = process.env.PORT || 5000;

var server = app.listen(port, function (){
	console.log('Node app listening on port', port);
});