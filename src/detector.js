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
var process = require("child_process");

var deviceIPAddr;
var sampleRate = 10000.0;
var thresholdForAutoOn;
var downTime = 0;
var currentlyAtHome = true;
var notificationList = [];

var on_exclusion_time = [];
var on_light_ids = [];
var off_light_ids = [];

function start(settings) {
	deviceIPAddr = settings.device_ip_address;
	thresholdForAutoOn = settings.threshold_for_auto_on_secs / (sampleRate / 1000);
	console.log("threshold: " + thresholdForAutoOn);
	pingDevice();
}

function notify(callback) {
	notificationList.push(callback);
}

function isAtHome() {
	return currentlyAtHome;
}

function setIsAtHome(value) {
	if (currentlyAtHome !== value) {
		winston.info("isAtHome changed: " + value);

		currentlyAtHome = value;
		for (var i = 0; i < notificationList.length; ++i) {
			notificationList[i](currentlyAtHome);
		}
	}
}

function pingDevice() {
	probe(deviceIPAddr, function(result) {
		if (result) {
			if (downTime > thresholdForAutoOn) {
				setIsAtHome(true);
			}
			downTime = 0;
		}
		else {
			if (downTime > thresholdForAutoOn) {
				setIsAtHome(false);
			}
			downTime += 1;
		}
	});
	setTimeout(pingDevice, sampleRate);
}

function probe(addr, cb) {
        var ping = process.spawn('/bin/ping', ['-n', '-w 2', '-c 1', addr]);
		ping.on('exit', function (code) {
            var result = (code === 0 ? true : false);
            cb && cb(result);
        });
}

exports.start = start;
exports.notify = notify;
exports.isAtHome = isAtHome;
