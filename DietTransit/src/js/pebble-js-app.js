var API_ROOT = 'https://diettransit.herokuapp.com/';
var myToken;

// request a pin to be sent to the userToken
function requestPin (userToken, minutesToAdd){
	var xhr = new XMLhttpRequest();

	// construct the url for the api
	var url = API_ROOT + '/senduserpin/' + userToken + '/' + minutesToAdd;

	xhr.open('GET', url, true);

	xhr.onload = function (){
		console.log('requestPin server response: ' + xhr.responseText);

		// update text on the watch to say we've sent the pin
		Pebble.sendAppMessage({
			text: 'Sent!\nCheck your timeline!'
		});

		// set a timer to quite the app in 2 seconds
		setTimeout(function (){
			Pebble.sendAppMessage({
				quit: true
			}, 2000);
		});
	};

	xhr.send();
}

// ready event
Pebble.addEventListener('ready', function (event){
	Pebble.getTimelineToken(function (token){
		// tell the C file that we're ready
		Pebble.sendAppMessage({
			ready: true
		});

		// log the timeline token
		console.log('My timeline token is ' + token);

		// store the token in our global var
		myToken = token;
	}, function (error){
		console.log('Error getting timeline token: ' + error);
	});
});

Pebble.addEventListener('appmessage', function (event){
	console.log('Received message: ' + JSON.stringify(event.payload));

	if (event.payload.minutes) {
		requestPin(myToken, event.payload.minutes);
	}
});