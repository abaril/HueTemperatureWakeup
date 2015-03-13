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

var hue = require("./hue");
var winston = require("winston");
var moment = require("moment-timezone");

var on_exclusion_time = [];
var on_light_ids = [];
var off_light_ids = [];
var timezone_adjust_hours = 0;
var timezone_adjust_minutes = 0;

function start(settings) {
	on_light_ids = settings.auto_on_light_ids;
	off_light_ids = settings.auto_off_light_ids;
	on_exclusion_time = settings.auto_on_exclude_time_range;
  timezone = settings.timezone;
}

function setSunriseAndSunset(sunrise, sunset)
{
   on_exclusion_time = [
      {
         "Hour": sunrise.getHours(),
         "Minute": sunrise.getMinutes()
      },
      {
         "Hour": sunset.getHours(),
         "Minute": sunset.getMinutes()
      }
   ];
}

function outsideExclusionTime() {

	if (on_exclusion_time.length >= 2) {
      var exclusionStart = moment().hour(on_exclusion_time[0].Hour).minute(on_exclusion_time[0].Minute).second(0).tz(timezone);
      var exclusionStop = moment().hour(on_exclusion_time[1].Hour).minute(on_exclusion_time[1].Minute).second(0).tz(timezone);
      var now = moment();

      winston.info("Current time = " + now.format());
      winston.info("Exclusion start time = " + exclusionStart.format());
      winston.info("Exclusion stop time = " + exclusionStop.format());

      if ((now < exclusionStart) || (now > exclusionStop)) {
        return true;
      }
      return false;
	}
	return true;
}

function setLights(value) {
    if (value) {
        if (outsideExclusionTime()) {
            winston.info("Turning lights on");
            for (i = 0; i < on_light_ids.length; ++i) {
                hue.turnLightOn(on_light_ids[i]);
            }
        }
        else {
          var currentTime = new Date();
          winston.info("Ignoring setLights on due to exclusion time period: " + JSON.stringify(on_exclusion_time));
          winston.info("Current time = " + currentTime.getHours() + ":" + currentTime.getMinutes());
        }
    }
    else {								
        for (i = 0; i < off_light_ids.length; ++i) {
            hue.turnLightOff(off_light_ids[i]);
        }				
    }
}

exports.start = start;
exports.setLights = setLights;
exports.setSunriseAndSunset = setSunriseAndSunset;
