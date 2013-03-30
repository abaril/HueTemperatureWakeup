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

var alarmHour = 07;
var alarmMinute = 40;
var nextAlarmDate;
var alarmFunc;

function start(settings, alarmFunction) {

	alarmFunc = alarmFunction;
	alarmHour = settings.alarm_time_hour;
	alarmMinute = settings.alarm_time_minute;

	nextAlarmDate = determineNextAlarmDate();
	checkAlarm();	
}

function checkAlarm() {
		if (secondsLeft() <= 0) {
			alarmFunc();
			nextAlarmDate = determineNextAlarmDate();
		}
		setTimeout(checkAlarm, 1000);
}

function determineNextAlarmDate()
{
	var alarmTime = new Date();
	alarmTime.setHours(alarmHour, alarmMinute, 0, 0);
	winston.info("Next alarm = " + alarmTime.toTimeString());

	if (secondsLeft(alarmTime) <= 0) {
		alarmTime.setDate(alarmTime.getDate() + 1);
		while ((alarmTime.getDay() == 0) || (alarmTime.getDay() == 6)) {
			alarmTime.setDate(alarmTime.getDate() + 1);
		}
	}
	return alarmTime;	
}

function secondsLeft(alarmTime) {
	if (alarmTime === undefined) {
		alarmTime = nextAlarmDate;
	}

	var now = new Date();
	winston.debug("Time left " + (alarmTime.getTime() - now.getTime()) / 1000);
	return (alarmTime.getTime() - now.getTime()) / 1000;
}

exports.start = start;
exports.secondsLeft = secondsLeft;
