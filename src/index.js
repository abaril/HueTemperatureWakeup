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
var timer = require("./timer");
var hue = require("./hue");
var detector = require("./detector");
var lightController = require("./lightController");

var express    = require('express');
var app        = express();

var settings = {
    "gateway_address": "192.168.xxx.yyy",
    "gateway_user": "user_id",
    "light_id": 2,
    "auto_on_light_ids": [1],
    "auto_off_light_ids": [1, 2, 3, 4],
    "auto_on_exclude_time_range": [{"Hour": 7, "Minute": 0}, {"Hour": 19, "Minute": 0}],
    "alarm_time_hour": 19,
    "alarm_time_minute": 57,
    "longitude": "-79.38318",
    "latitude": "43.65323",
    "darksky_api_key": "-",
    "device_ip_address": "192.168.xxx.yyy",
    "threshold_for_auto_on_secs": 1200.0
};

if (typeof process.env.SETTINGS != 'undefined') {
    settings =  JSON.parse(process.env.SETTINGS);
}

winston.setLevels(winston.config.syslog.levels);
// winston.add(winston.transports.File, {
//         "filename": "log/server.log",
//         "handleExceptions": true,
//         "level": "info"
// });

winston.info("Settings = " + JSON.stringify(settings));

process.on('uncaughtException', function(err) {
  console.log(err);
  winston.log(err);
});

timer.start(settings, function() { hue.triggerAlarm(); });
// detector.start(settings);
lightController.start(settings);
hue.start(settings, lightController);

// detector.notify(lightController.setLights);

var port = process.env.PORT || 8080;
var router = express.Router();
router.get('/status', function(req, res) {
    res.json(settings);   
});
app.use('/api', router);

app.listen(port);
