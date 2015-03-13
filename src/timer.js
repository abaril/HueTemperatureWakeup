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
var moment = require("moment-timezone");

var alarmHour = 07;
var alarmMinute = 40;
var timezone;
var nextAlarmDate;
var alarmFunc;

function start(settings, alarmFunction) {

	alarmFunc = alarmFunction;
	alarmHour = settings.alarm_time_hour;
	alarmMinute = settings.alarm_time_minute;
	timezone = settings.timezone;

	nextAlarmDate = determineNextAlarmDate();
	checkAlarm();	
}

function checkAlarm() {
	if (alarmTime < moment()) {
		winston.info("Alarm time!");
		alarmFunc();
		nextAlarmDate = determineNextAlarmDate();
	}

	setTimeout(checkAlarm, 1000);
}

function determineNextAlarmDate()
{
	alarmTime = moment().hour(alarmHour).minute(alarmMinute).second(0).tz(timezone);
	if (alarmTime < moment()) {
		alarmTime.add(1, 'days');
		while (alarmTime.isoWeekday() >= 6) {
			alarmTime.add(1, 'days');
		}
	}
	winston.info("Next alarm = " + alarmTime.format());
	return alarmTime;	
}

exports.start = start;
