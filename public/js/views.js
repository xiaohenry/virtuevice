/**
 * @file views.js
 * @description Handles generating the list page. It uses HandlebarsJS to generate the DOM from Habit objects.
 */
var UTILS = {
	debug: false,
	log: function(message, obj) {
		if (UTILS.debug) {
			obj = obj ? obj : '';
			console.log(message);
		}
	}
};
/******************************************************************************
* Listener - For Document. Loads all the habits onto the main page
*
******************************************************************************/
$(document).on('ready', function() {
	if ($('body').attr('id') !== 'list-page') {
		return;
	}
	Parse.initialize('hIP8KstprKjGsmE4VVHT86i2m1VobE8Mc0x7pBi6', 'ixAsSo9S7uCHLCKqdfKhUt1ZNcOBGX129Toy8QyO');

    var Habit = Parse.Object.extend('Habit');
    var query = new Parse.Query(Habit);
    var userHabits = [];
    query.equalTo('userId', Parse.User.current().id);
    query.descending('createdAt');
    query.find({
        success: function(results) {
            for (var i=0, len=results.length; i<len; i++) {
                var habit = results[i];
                var source = $('#habit-list-template').html();
                var template = Handlebars.compile(source);
                var habitTemplateObj = {
                    id: habit.id,
                    name: habit.get('name'),
                    img: (habit.get('img') ? habit.get('img').url() : '../img/logo.jpg'),
                    timesPerDay: habit.get('timesPerDay'),
                    doneToday: habit.get('doneToday'),
                    currentRecord: habit.get('currentRecord'),
                    bestRecord: habit.get('bestRecord'),
                    dayOfWeek: habit.get('dayOfWeek')
                };
                userHabits.push(habitTemplateObj);
            }

            if(!userHabits.length){
                $('.loader').css({display:'none'});
            }
			if (!template) {
				return;
			}
			// Use HandlebarsJS to generate the DOM
            var compiledHtml = template(userHabits);
            $('#habit-list').html(compiledHtml);

			// After DOM generation, manipulate it to reflect the habit's correct state
            userHabits.forEach(function(habit) {

				// each habit DOM element has an object ID associated with it - grab it using its ID
				var id = habit.id;
				var habitNode = $('#' + id);

				// highlight active days
				for (var j=0, len=habit.dayOfWeek.length; j<len; j++) {
					habitNode.find('.weekly-view-' + habit.dayOfWeek[j]).addClass('active');
				}

				// highlight today's day
                var days = ['sun', 'mon', 'tues', 'wed', 'thu', 'fri', 'sat'];
                var d = new Date();
                var today = d.getDay(); // returns 0-7
				var statusBar = habitNode.find('.status-bar')[0];
                habitNode.find('.weekly-view-' + days[today]).addClass('today');

				// habit is not scheduled for today - make it opaque
				if (habit.dayOfWeek.indexOf(days[today]) === -1) {
					habitNode.find('.op-done').addClass('disabled');
					habitNode.find('.status-bar-wrapper').css('background-color', 'white');
					$(statusBar).animate({
						width: '100%',
						opacity: 0.35
					});
					habitNode.find('.message-today').html("<strong>You're good today!</strong>");
					habitNode.find('.op-done').css({
						'box-shoadw': 'none',
						'background-color': '#48ba87',
						'opacity': '0.35'
					});
				} else {
	                var timesDone = habitNode.find('.times-done-today')[0].textContent;
	                var timesPerDay = habitNode.find('.times-per-day')[0].textContent;
	                var ratio = timesDone/timesPerDay * 100;
					$(statusBar).animate({
						width: ratio + '%'
					});
				}
            });
        },
        error: function(error) {
            UTILS.log("Error: " + error.code + " " + error.message);
        }
    });
});/*END OF DOCUMENT*/
