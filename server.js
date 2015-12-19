// Require Node Modules
var http = require('http'),
	express = require('express'),
	bodyParser = require('body-parser'),
	Parse = require('parse/node'),
	ParseCloud = require('parse-cloud-express')
	CronJob = require('cron').CronJob,
	Mixpanel = require('mixpanel'),
	rollbar = require('rollbar'),
	app = express();

// Import your cloud code (which configures the routes)
require('./cloud/main.js');
// Mount the webhooks app to a specific path (must match what is used in scripts/register-webhooks.js)
app.use('/webhooks', ParseCloud.app);

// Host static files from public/
app.use(express.static(__dirname + '/public'));

// Catch all unknown routes.
app.all('/', function(request, response) {
	response.status(404).send('Page not found.');
});
/*
* Launch the HTTP server
*/
var port = process.env.PORT || 5000;
var server = http.createServer(app);
server.listen(port, function() {
	console.log('Cloud Code Webhooks server running on port ' + port + '.');
});

/*************** START OF MAIN CODE ***************/

var dayOfWeek = ['sun','mon','tues','wed','thu','fri','sat'];

rollbar.init("30a3940110184a33aee5c9f263d81d90");

var mixpanel = Mixpanel.init('077b5e58e54b670b00ca70082dd0d46b');

/**
 * @function sendNotification
 * @description OneSignal API AJAX call
 */
function sendNotification(data) {
	var headers = {
		"Content-Type": "application/json",
		"Authorization": "Basic ODgzNTg5MDktZTA2Mi00MmQ4LTgxNjgtZWYwNDg3Y2UyMGMz"
	};

	var options = {
		host: "onesignal.com",
		port: 443,
		path: "/api/v1/notifications",
		method: "POST",
		headers: headers
	};

	var https = require('https');
	var req = https.request(options, function(res) {
		res.on('data', function(data) {
			console.log("Response:");
			console.log(JSON.parse(data));
		});
	});

	req.on('error', function(e) {
		console.log("ERROR:");
		console.log(e);
	});

	req.write(JSON.stringify(data));
	req.end();
};

/**
 * @function getTime
 * @description fetch local time or day
 * @param retrieveTime {Boolean} - retrieving local time
 * @param retrieveDay {Boolean} - retrieving local day
 */
function getLocalTime(retrieveTime, retrieveDay){
	var identifier = 'am';
	var d = new Date();
	var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    var offset = -8.0;
    var date = new Date(utc + (3600000*offset));

	var hour = date.getHours();
	var minutes = ('0' + date.getMinutes()).slice(-2);
	if(hour === 12){
		identifier = 'pm';
	}
	else if(hour === 0){
		hour = 12;
	}
	else if(hour > 12){
		hour = hour-12;
		identifier = 'pm';
	}
	if (retrieveTime) {
		return hour + ':' + minutes + identifier;
	} else if (retrieveDay){
		return date.getDay();
	}
}

function getServerTime(retrieveTime, retrieveDay) {
	var identifier = 'am';
	var d = new Date();
	var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
	var offset = 0;
    var date = new Date(utc + 3600000*offset);

	var hour = date.getHours();
	var minutes = ('0' + date.getMinutes()).slice(-2);
	if(hour === 12){
		identifier = 'pm';
	}
	else if(hour === 0){
		hour = 12;
	}
	else if(hour > 12){
		hour = hour-12;
		identifier = 'pm';
	}
	if (retrieveTime) {
		return hour + ':' + minutes + identifier;
	} else if (retrieveDay){
		return date.getDay();
	}
}

var dailyResetJob = new CronJob({
	cronTime: '0 59 07 * * *',
	// cronTime: '34 18 * * *',
	// cronTime: '0 42 2 * * *',
	// cronTime: '* 34 19 * * *',
	// cronTime: '* 25 6 * * *',
	// cronTime: '28 03 * * * *',
	onTick: function() {
		console.log('Clearing out doneTodays');
		//Runs everyday at midnight on the hour
		Parse.initialize('hIP8KstprKjGsmE4VVHT86i2m1VobE8Mc0x7pBi6', 'ixAsSo9S7uCHLCKqdfKhUt1ZNcOBGX129Toy8QyO');
		var habit = Parse.Object.extend('Habit');
		var query = new Parse.Query(habit);
		var today = getServerTime(false, true);
		today = (today === 0) ? 6 : today--;
		query.equalTo("dayOfWeek",dayOfWeek[today]);
		query.find({
			success: function(results) {
				for(var i = 0, len=results.length; i < len; i++){
					if(results[i].get('doneToday') < results[i].get('timesPerDay')){
						results[i].set("currentRecord", 0);
					}
					results[i].set("doneToday",0);
					mixpanel.track('Resetting non-zero habit');
				}
				Parse.Object.saveAll(results, {
					success: function(result){
						console.log("Saved");
					},
					error: function(error){
						console.log("Failed");
					}
				});
			},
			error: function(){
				console.log("Failed");
			}
		});
		console.log('job2 ran');
	},
	// start: false // Start Job now
	start: false
});
dailyResetJob.start();

/**
 * Check Habits every 30 minutes and set out notification reminders
 */
var sendNotificationsJob = new CronJob({
	// cronTime: '* */30 * * * *',
	cronTime: '*/30 * * * *',
	onTick: function() {
		// Runs every 30 minutes on the hour and 30 minutes past the hour
		console.log('Checking for notifications');
		Parse.initialize('hIP8KstprKjGsmE4VVHT86i2m1VobE8Mc0x7pBi6', 'ixAsSo9S7uCHLCKqdfKhUt1ZNcOBGX129Toy8QyO');

		var notify = Parse.Object.extend('Notification');
		var habit = Parse.Object.extend('Habit');
		var habitsToday = [];
		var query = new Parse.Query (notify);
		var queryHabit = new Parse.Query(habit);
		var today = getLocalTime(false, true);

		queryHabit.equalTo("dayOfWeek",dayOfWeek[today]);
		queryHabit.find({
			success:function(results){
			console.log('Found notifications for ' + dayOfWeek[today]);
				for(var i = 0, len = results.length; i < len; i++){
					habitsToday.push(results[i]);
				}
				query.containedIn("habit", habitsToday);
				query.exists("playerId");
				query.find({
					success: function(results){
						console.log('Found notification with players');
						var time = getLocalTime(true, false);
						var i, len, habit, notification;
						var title;
						var notification;
						var habit;

						for(i=0, len = results.length; i < len; i++) {
							if(results[i].get('time') === time) {
								notification = results[i];
								habit = results[i].get('habit');
								habit.fetch({
									success: function(habit){
										console.log('Fetching and checking doneToday');
										var doneToday = habit.get('doneToday');
										var timesPerDay = habit.get('timesPerDay');
										if (doneToday >= timesPerDay) {
											return;
										}
										console.log('Sending a notification!');
										var name = habit.get('name');
										var message = {
											app_id: "b3c603af-2d68-4f2a-a0d8-f9689e985e5a",
											headings: {"en": "Virtue Vice Reminder!"},
											contents: {"en": "You've completed " + doneToday + "/" + timesPerDay + " for " + name + " today!"},
											include_player_ids: [notification.get('playerId')],
										};
										mixpanel.track('Notification sent');
										sendNotification(message);
									},
									error: function(habit,error){
										console.log('error');
									}
								});
							}
						}
					},
					error:function(error){
						console.log("there is an error");
					}
				}); //End of Inner Query
			},
			error:function(error){
				consle.log("there are no habits today");
			}
		}); //End of Outer Query */

		console.log('job ran');
	},
	timeZone: 'America/Los_Angeles',
	start: false
});
sendNotificationsJob.start();
