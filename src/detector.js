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

var winston = require("winston");
var ping = require("ping");
var process = require("child_process");
var hue = require("./hue");

var deviceIPAddr;
var sampleRate = 10000.0;
var thresholdForAutoOn;
var downTime = 0;
var light_id;
var currentlyOn = false;

function start(settings) {
	deviceIPAddr = settings.device_ip_address;
	thresholdForAutoOn = settings.threshold_for_auto_on_secs / (sampleRate / 1000);
	console.log("threshold: " + thresholdForAutoOn);
	light_id = settings.auto_on_light_id;
	
	pingDevice();
}

function pingDevice() {
	probe(deviceIPAddr, function(result) {
		if (result) {
			console.log("on");
			if (downTime > thresholdForAutoOn) {
				winston.info("Back on after: " + downTime);
				hue.turnLightOn(light_id);
				currentlyOn = true;
			}
			downTime = 0;
		}
		else {
					console.log("off");
			if (currentlyOn && (downTime > thresholdForAutoOn)) {
				winston.info("Auto off");
				hue.turnLightOff(light_id);
				currentlyOn = false;
			}
			downTime += 1;
		}
	});
	setTimeout(pingDevice, sampleRate);
}

function probe(addr, cb) {
        var ls = process.spawn('/sbin/ping', ['-n', '-W 2', '-c 1', addr]);
        ls.on('exit', function (code) {
            var result = (code === 0 ? true : false);
            cb && cb(result);
        });
}

exports.start = start;