// Copyright (c) 2013 Allan Baril
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software 
// and associated documentation files (the "Software"), to deal in the Software without restriction, 
// including without limitation the rights to use, copy, modify, merge, publish, distribute, 
// sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is 
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in all copies or 
// substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT 
// NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND 
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, 
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var hue = require("node-hue-api");
var lightState = require("node-hue-api").lightState;
var winston = require("winston");
var https = require("https");
var detector = require("./detector");

var api;
var light_id;
var forecastRequestURL;
var lightController;

var displayResult = function(result) {
    winston.info(JSON.stringify(result, null, 2));
};

function turnLightOff(light, result) {
	if (typeof light === "undefined") {
		light = light_id;
	}

	state = lightState.create();
	api.setLightState(light, state.off()).done();
}

function turnLightOn(light, rgb) {
	if (typeof light === "undefined") {
		light = light_id;
	}

	if (typeof rgb !== "undefined") {
		state = lightState.create().rgb(rgb.red, rgb.green, rgb.blue).on().brightness(100).transition(30);
	}
	else {
		state = lightState.create().on().brightness(100).transition(2);
	}
	api.setLightState(light, state).done();
}

function start(settings, controller) {

	forecastRequestURL = createForecastRequestURL(settings);

   lightController = controller; 

	light_id = settings.light_id;
	api = new hue.HueApi(settings.gateway_address, settings.gateway_user);
	api.connect().then(displayResult).done();   
   
   setTimeout(turnLightOff, 10000);
}

function triggerAlarm() {
	
	if (detector.isAtHome()) {
        https.get(forecastRequestURL, function(res) {
            var data = "";
            res.on('data', function (chunk) {
                data = data + chunk;
            });
            res.on('end', function() {
                winston.debug("===");
                winston.debug(data);
                winston.debug("===");
                    
                forecast = JSON.parse(data);
                determineSunriseSunset(forecast);
                rgb = colorForForecast(forecast);
                turnLightOn(light_id, rgb);		
            });
        }).on('error', function(err) {
            winston.error("Error: " + err.message);
        
            state = lightState.create();
            api.setLightState(light_id, state.alert(true)).done();
        });	
    }
    else {
        winston.log("Ignoring alarm as not home");
    }
}

function determineSunriseSunset(forecast) {

   if ((typeof forecast.daily.data[0].sunriseTime === "undefined") ||
       (typeof forecast.daily.data[0].sunsetTime === "undefined")) {
      return;
   }
   
   var sunriseTime = new Date(forecast.daily.data[0].sunriseTime * 1000);
   var sunsetTime = new Date(forecast.daily.data[0].sunsetTime * 1000);

   winston.info("Sunrise = " + sunriseTime.getHours() + ":" + sunriseTime.getMinutes());
   winston.info("Sunset = " + sunsetTime.getHours() + ":" + sunsetTime.getMinutes());

   lightController.setSunriseAndSunset(sunriseTime, sunsetTime);
}

function colorForForecast(forecast) {
	var rgb = {
		"red": 0.0,
		"green": 0.0,
		"blue": 0.0
	};
	
	var precipitation = false;
	if (typeof forecast.daily.data[0].precipType !== "undefined") {
	    precipitation = true;
	}
	
	maxRain = forecast.daily.data[0].precipIntensityMax;
	if (typeof forecast.daily.data[0].precipProbability !== "undefined") {
		maxRain = forecast.daily.data[0].precipProbability;
	}
	maxTemp = convertToCelcius(forecast.daily.data[0].temperatureMax);
	
	winston.info("Current temp = " + convertToCelcius(forecast.currently.temperature));
	winston.info("Max temp = " + maxTemp);
	winston.info("Probability of precipitation = " + maxRain);
	
	if (precipitation) {
		rgb.blue = 255.0 * maxRain;
	}
	else {
		rgb.red = 255.0;
		rgb.green = ((50.0 - maxTemp) / 30.0) * 255.0;
		if (rgb.green > 255.0) {
			rgb.green = 255.0;
		}
		if (rgb.green < 0.0) {
			rgb.green = 0.0;
		}
	}

	return rgb;
}

function convertToCelcius(tempInF) {
	return (tempInF - 32.0) / 1.8;
}

function createForecastRequestURL(settings) {
	return "https://api.forecast.io/forecast/" + settings.darksky_api_key + "/" + settings.latitude + "," + settings.longitude;
}

exports.start = start;
exports.triggerAlarm = triggerAlarm;
exports.turnLightOn = turnLightOn;
exports.turnLightOff = turnLightOff;
