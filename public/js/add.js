/**
* @file add.js
* @description
*/

/******************************************************************************
*** CONSTANTS
*****************************************************************************/
const INVALID_FILE_FORMAT = 'invalid file format';
const REQUIRED = 'required';
const INVALID_FILE_SIZE = 'max 2MB';
const MAX_FILE_SIZE = 2097152;

var oneSignalPlayerId;

var UTILS = {
	debug: false,
	log: function(message, obj) {
		if (UTILS.debug) {
			obj = obj ? obj : '';
			console.log(message);
		}
	}
};

$(document).on('ready', function () {
	Parse.initialize('hIP8KstprKjGsmE4VVHT86i2m1VobE8Mc0x7pBi6', 'ixAsSo9S7uCHLCKqdfKhUt1ZNcOBGX129Toy8QyO');
	$('#current-user').html(Parse.User.current().get('email'));

	OneSignal.push(["getIdsAvailable", function(ids) {
		oneSignalPlayerId = ids.userId;
	}]);
	/* Listener to Check if the user is on the edit page */
	if ($('body').attr('id') === 'edit-page') {
		populateEditForm();
	}
	bindEventListeners();
});

/******************************************************************************
* @function getDailyFreq
* @description returns the daily frequency
* @return Number
******************************************************************************/
function getDailyFreq() {
	var freq = 0;
	freq = Number($('#daily-freq').val());
	if (freq > 10 || freq < 1) {
		freq = 0;
	}
	return freq;
}

/******************************************************************************
* @function getWeeklyFreq
* @description returns days of the week
* @return []
*****************************************************************************/
function getWeeklyFreq() {
	var days = [];
	$('.weekly-freq.active').each(function() {
		days.push(this.textContent.trim().toLowerCase());
	});
	return days;
}

/******************************************************************************
* @function createFileFromUpload
* @description create a ParseFile from an image upload
* @return ParseFile
*****************************************************************************/
function createFileFromUpload() {
	var parseFile;
	var fileUploadControl = $('#icon-upload-input')[0];
	if (fileUploadControl.files.length > 0 && fileUploadControl.files[0].type.match('image.*')) {
		var file = fileUploadControl.files[0];
		var name = "photo.jpg";
		parseFile = new Parse.File(name, file);
	}
	return parseFile;
}

/******************************************************************************
* @function getNotificationTimes
* @description return notification times from the add/edit form
* @return []
*****************************************************************************/
function getNotificationTimes() {
	var times = [];
	$('.notification-input-time').each(function() {
		if (times.indexOf(this.textContent) === -1) {
			times.push(this.textContent);
		}
	});
	return times;
}

/******************************************************************************
* @function validateForm
* @description validates an add/edit habit form
* @return Boolean
*****************************************************************************/
function validateForm(titleLength, parseFile, weeklyFreq, dailyFreq) {
	UTILS.log('Attempting to add/save habit');
	UTILS.log('Title Length: ' + titleLength);
	UTILS.log('Icon: ' + parseFile);
	UTILS.log('Weekly Freq: ' + weeklyFreq);
	UTILS.log('Daily Freq: ' + dailyFreq);

	var hasError = false;

	if (!titleLength) {
		$('.add-title-error').show();
		hasError = true;
	} else {
		$('.add-title-error').hide();
	}
	if (parseFile && parseFile._source && parseFile._source.file.size > MAX_FILE_SIZE) {
		$('.add-icon-error').text(INVALID_FILE_SIZE);
		$('.add-icon-error').show();
		hasError = true;
	} else {
		$('.add-icon-error').hide();
	}
	if (!weeklyFreq.length) {
		$('.add-weekly-error').show();
		hasError = true;
	} else {
		$('.add-weekly-error').hide();
	}
	if (!dailyFreq) {
		$('.add-daily-error').show();
		hasError = true;
	} else {
		$('.add-daily-error').hide();
	}
	if (hasError) {
		$('.forms-required').css('visibility','visible');
		mixpanel.track('Improperly filled form');
		return false;
	}
	$('.forms-required').css('visibility','hidden');
	return true;
}

/******************************************************************************
* @function appendNotificationTime
* @description appends a notification time to a form
*****************************************************************************/
function appendNotificationTime(notificationTimeVal, notificationZoneVal) {

	var notificationTimeVal = notificationTimeVal || $('#notification-input').val();
	var notificationZoneVal = notificationZoneVal || $('#notification-input-ampm').val();

	// create new DOM elements
	var notificationWrapper = $('<div class="notification-option-wrapper"></div>');
	var notificationLeft = $('<div class="notification-left"></div>');
	var notificationTime = $('<p class="notification-input-time">' + notificationTimeVal + notificationZoneVal + '</p>');
	var notificationRight = $('<div class="notification-right"></div>');
	var notificationDeleteBtn = $('<button class="notification-delete-btn"> - </button>');

	// append element to DOM
	notificationLeft.append(notificationTime);
	notificationRight.append(notificationDeleteBtn);
	notificationWrapper.append(notificationLeft);
	notificationWrapper.append(notificationRight);
	$('#notification-container').prepend(notificationWrapper);
}
/******************************************************************************
* @function populateEditForm
* @description populates a form when a user hits the Edit page
*****************************************************************************/
function populateEditForm() {
	var HabitToEdit = Parse.Object.extend('HabitToEdit');
	var query = new Parse.Query(HabitToEdit);
	query.include('habit');
	query.equalTo('userId', Parse.User.current().id);
	query.first({
		success: function(result) {
			var habit = result.get('habit');
			var weeklyFreq = habit.get('dayOfWeek');
			$('#title').val(habit.get('name'));
			$('#daily-freq').val(habit.get('timesPerDay'));
			if (habit.get('img')) {
				$('#icon').attr('src', habit.get('img').url());
			}
			weeklyFreq.forEach(function(day) {
				$('.weekly-freq-' + day.toLowerCase()).addClass('active');
			});
			$('.hidden-habit-id').attr('id', habit.id);

			var Notification = Parse.Object.extend('Notification');
			var query2 = new Parse.Query(Notification);
			query2.equalTo('habit', habit);
			query2.find({
				success: function(results) {
					// returns all the notifications associated with this Habit
					for (var i=0, len=results.length; i<len; i++) {
						appendNotificationTime(results[i].get('time').slice(0,-2),results[i].get('time').slice(-2));
					}
				},
				error: function(error) {
					UTILS.log("Error: " + error.code + " " + error.message);
				}
			});
		},
		error: function(error) {
			UTILS.log("Error: " + error.code + " " + error.message);
		}
	});
}
/******************************************************************************
* @function bindEventListeners
* @description binds all event listeners for add, edit, list page
*****************************************************************************/
function bindEventListeners() {

	/*Bind the button to add Notifications*/
	$('#notification-add-btn').on('click', function(e) {
		e.preventDefault();
		appendNotificationTime();
	});

	/*Bind the button to delete Notifications*/
	$(document).on('click', '.notification-delete-btn', function(e) {
		e.preventDefault();
		var parentNode = $(this).closest('.notification-option-wrapper');
		$(parentNode).remove();
	});

	/*Bind the button to upload icons*/
	$('#icon-upload-btn').on('click', function() {
		UTILS.log('Uploading an image');
		$('#icon-upload-input').click();
	});
	$('#icon-upload-input').on('change', function() {
		var file = this.files;
		UTILS.log(file);
		// validate image types
		if (!file || !file[0].type.match('image.*')) {
			$('.add-icon-error').text(INVALID_FILE_FORMAT);
			$('.add-icon-error').show();
			return;
		}
		if (typeof (FileReader) !== 'undefined') {
			var reader = new FileReader();
			reader.onload = function(e) {
				$('#icon').attr('src', e.target.result);
			}
			reader.readAsDataURL(this.files[0]);
		}
	});

	/*Binding for week buttons*/
	$('#weekly-container .weekly-freq').on('click', function () {
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
		} else {
			$(this).addClass('active');
		}
	});

	/*Binding for day buttons*/
	$('#daily-container .daily-freq').on('click', function() {
		var activeFreq = $('.daily-freq.active');
		if ($(this).hasClass('active')) {
			activeFreq.removeClass('active');
			return;
		}
		activeFreq.removeClass('active');
		$(this).addClass('active');
	});
	// @deprecated - no longer need an active image
	// $('.icon-wrapper').on('click',function(){
	// 	var activeIcon = $('.icon.active');
	// 	var thisIcon = $(this).find('.icon');
	// 	if (thisIcon.hasClass('active')) {
	// 		activeIcon.removeClass('active');
	// 		return;
	// 	}
	// 	activeIcon.removeClass('active');
	// 	thisIcon.addClass('active');
	// });

	/*Binding Add Habit Button*/
	$('#add-habit-btn').on('click', function() {
		location.href = 'add.html';
	});

	/*Binding the save button for a habit that is newly made*/
	$('#save-habit-button').on('click', function(e) {
		e.preventDefault(); // need to prevent Default b/c submit button is inside a form --> default behavior is to issue a POST
		var habitName = $('#title').val().trim();
		if (habitName) {
			habitName = habitName.replace(/^./, habitName[0].toUpperCase());
		}
		var weeklyFreq = getWeeklyFreq();
		var dailyFreq = getDailyFreq();
		var parseFile = createFileFromUpload();

		var titleLength = $('#title').val() ? $('#title').val().trim().length : 0;
		if (validateForm(titleLength, parseFile, weeklyFreq, dailyFreq)) {
			// add habit with uploaded image
			if (parseFile && parseFile._source.file && parseFile._source.file.type.match('image.*')) {
				parseFile.save().then(function(imgFile) {
					addHabit(imgFile);
				},
				function error() {
					UTILS.log('Could not save file');
				});
				// add habit with default logo
			} else {
				addHabit();
			}
		}
		/**********************************************************************
		* @function addHabit
		* @description nested helper function to add a habit
		**********************************************************************/
		function addHabit(imgFile) {
			var Habit = Parse.Object.extend('Habit');
			var habit = new Habit();
			// Sets the fields for the newly created Habits
			habit.save({
				userId: Parse.User.current().id,
				name: habitName,
				img: imgFile,
				dayOfWeek: weeklyFreq,
				timesPerDay: dailyFreq,
				doneToday: 0,
				bestRecord: 0,
				currentRecord: 0
			}, {
				//Sets the notifications for the newly created Habits
				success: function(habit) {
					mixpanel.track(
						'Created habit',
						{
							'timesPerDay': dailyFreq,
							'timesPerWeek': weeklyFreq.length,
						}
					);
					var notificationTimes = getNotificationTimes();
					if (notificationTimes.length) {
						var Notification = Parse.Object.extend('Notification');
						var notifications = [];
						for (var i=0, len=notificationTimes.length; i<len; i++) {
							var notification = new Notification();
							notification.set('habit', habit);
							notification.set('time', notificationTimes[i]);
							notification.set('playerId', oneSignalPlayerId);
							notifications.push(notification);
						}
						//Save the all of the notifiaction objects
						Parse.Object.saveAll(notifications, {
							success: function(result) {
								location.href = 'list.html';
							},
							error: function(error) {
								UTILS.log('Error:' + error.code + " " + error.message);
							}
						});

					} else {
						location.href = 'list.html';
					}
				},
				error: function(error) {
					UTILS.log("Error: " + error.code + " " + error.message);
				}
			});
		}
		// }
	});

	/**************************************************************************
	* @function listener for a saving a habit that was edited
	* @description listen to save-edit clicks
	**************************************************************************/
	$('#edit-save-button').on('click',function(e){
		UTILS.log("ATTEMPTING TO SAVE AN EDITED HABIT");
		e.preventDefault();
		var habitName = $('#title').val().trim();
		if (habitName) {
			habitName = habitName.replace(/^./, habitName[0].toUpperCase());
		}
		var weeklyFreq = getWeeklyFreq();
		var dailyFreq = getDailyFreq();
		var parseFile = createFileFromUpload();
		var titleLength = habitName.length;
		var habitId = $('.hidden-habit-id');

		if (validateForm(titleLength, parseFile, weeklyFreq, dailyFreq)) {
			// add habit with uploaded image

			if (parseFile && parseFile._source.file && parseFile._source.file.type.match('image.*')) {
				parseFile.save().then(function(imgFile) {
					editHabit(imgFile);
				},
				function error(error) {
					UTILS.log("Error: " + error.code + " " + error.message);
				});
				// add habit with default logo
			} else {
				editHabit();
			}
		}
		/**********************************************************************
		* @function editHabit
		* @description nested helper function to save an edited habit
		**********************************************************************/
		function editHabit(imgFile) {
			var Habit = Parse.Object.extend('Habit');
			var query = new Parse.Query(Habit);
			query.equalTo('objectId', habitId.attr('id'));

			//query to find change the habit we are editing
			query.first({
				//Saves and updates the fields of the habit object
				success: function(result) {
					result.save({
						name: habitName,
						dayOfWeek: weeklyFreq,
						timesPerDay: dailyFreq,
						img: imgFile
					});
					mixpanel.track('Edited habit');
					var Notification = Parse.Object.extend('Notification');
					var queryNotify = new Parse.Query(Notification);
					queryNotify.equalTo('habit',result);

					//Query to find all notifcations associated with the current
					//habit in order to clear from the database.

					queryNotify.find({
						success: function(results){
							for (var i=0, len=results.length; i< len; i++){
								results[i].destroy();
							}
							// Grabs the new notification times that the user entered
							var notificationTimes = getNotificationTimes();
							if (notificationTimes.length) {
								var Notification = Parse.Object.extend('Notification');
								var notifications = [];
								for (var i=0, len=notificationTimes.length; i<len; i++) {
									var notification = new Notification();
									notification.set('habit', result);
									notification.set('time', notificationTimes[i]);
									notification.set('playerId', oneSignalPlayerId);
									notifications.push(notification);
								}
								// Save all the notifications that the user inputed
								Parse.Object.saveAll(notifications, {
									success: function(result) {
										location.href = 'list.html';
									},
									error: function(error) {
										UTILS.log('Error:' + error.code + " " + error.message);
									}
								});
							} else {
								location.href = 'list.html';
							}
						},
						error: function(error){
							UTILS.log('Error:' + error.code + " " + error.message);
						}
					}); // End of Find Query
				},	//End of first success function
				error: function(error){
					UTILS.log('Error:' + error.code + " " + error.message);
				}
			});
		}
	});

	/**************************************************************************
	* @function listener - edit
	* @description listen to edit clicks from the list page
	**************************************************************************/
	$(document).on('click', '.op-edit', function() {
		UTILS.log("ATTEMTPING TO EDIT HABIT");
		//fetches the habit of the button clicked
		var parentNode = $(this).closest('.habit-element');
		var id = parentNode.attr('id');
		var Habit = Parse.Object.extend('Habit');

		// fetch the habit object
		var query = new Parse.Query(Habit);
		query.equalTo('objectId', id);

		query.first({
			success: function(habit) {
				var HabitToEdit = Parse.Object.extend('HabitToEdit');
				var query2 = new Parse.Query(HabitToEdit);
				// see if this user currently has a HabitToEdit
				query2.equalTo('userId', Parse.User.current().id);
				query2.first({
					success: function(result) {
						// if edit habit doesn't exist, create one
						if (!result) {
							var habitToEdit = new HabitToEdit();
							habitToEdit.save({
								habit: habit,
								userId: Parse.User.current().id
							}, {
								success: function(obj) {
									location.href = 'edit.html';
								},
								error: function(error) {
									UTILS.log("Error: " + error.code + " " + error.message);
								}
							});
							// if edit habit exists, update it instead
						} else {
							result.save({
								habit: habit
							}, {
								success: function() {
									location.href = 'edit.html';
								},
								error: function(error) {
									UTILS.log("Error: " + error.code + " " + error.message);
								}
							});
						}
					},
					error: function(error) {
						UTILS.log("Error: " + error.code + " " + error.message);
					}
				});
			},
			error: function(error) {
				UTILS.log("Error: " + error.code + " " + error.message);
			}
		});
	});/*End of Edit */

	/**************************************************************************
	* @function listener - done
	* @description listen to done clicks
	**************************************************************************/
	$(document).on('click','.op-done:not(.disabled)', function () {
		var parentNode = $(this).closest('.habit-element');
		var id = parentNode.attr('id');

		var doneTodayNode = parentNode.find('.times-done-today')[0];
		var timesPerDayNode = parentNode.find('.times-per-day')[0];
		var currentRecordNode = parentNode.find('.current-record')[0];
		var bestRecordNode = parentNode.find('.best-record')[0];

		var doneToday = Number(doneTodayNode.textContent);
		var timesPerDay = Number(timesPerDayNode.textContent);
		//When the user more habits to complete
		if (doneToday < timesPerDay) {
			var Habit = Parse.Object.extend('Habit');
			var query = new Parse.Query(Habit);
			var incCurrent = false;
			var incBest = false;
			var currentRecord = Number(currentRecordNode.textContent);
			var bestRecord = Number(bestRecordNode.textContent);
			var statusBar = parentNode.find('.status-bar')[0];

			doneToday++;

			var ratio = doneToday/timesPerDay * 100;
			doneTodayNode.textContent = doneToday;

			$(statusBar).animate({
				width: ratio + '%'
			}, 200);

			//User has met his goal for habits done
			if (doneToday === timesPerDay) {
				currentRecord++;
				currentRecordNode.textContent = currentRecord;
				incCurrent = true;
				if (currentRecord > bestRecord) {
					bestRecord++;
					bestRecordNode.textContent = bestRecord;
					incBest = true;
				}
			}
			query.equalTo('objectId', id);
			query.first({
				success: function(result) {
					if (incCurrent) {
						result.increment('currentRecord');
						mixpanel.track('Finished habit');
					}
					if (incBest) {
						result.increment('bestRecord');
					}
					result.increment('doneToday');
					result.save();
				},
				error: function(error) {
					UTILS.log("Error: " + error.code + " " + error.message);
				}
			});
		}
	});

	/**************************************************************************
	* @function listener - ESC key
	* @description listen to ESCAPE key to close 'Delete habit confirmation'
	**************************************************************************/
	$(document).keyup(function(e) {
		if (e.keyCode === 27) { // escape key maps to keycode `27`
			$('#delete-cancel').click();
		}
	});

	/**************************************************************************
	* @function listener - done
	* @description listen to delete clicks to delete a habit on list page
	**************************************************************************/
	$(document).on('click', '.op-del', function() {
		UTILS.log("ATTEMPTING TO DELETE A HABIT");
		var parentNode = $(this).closest('.habit-element');
		var id = parentNode.attr('id');

		$('#mask').addClass('mask-filter');
		$('#confirm-delete').show();

		$('#delete-cancel, #delete-final').on('click', function() {
			$('#mask').removeClass('mask-filter');
			$('#confirm-delete').hide();
		});

		$('#delete-cancel').on('click', function() {
			parentNode = null;
		});

		$('#delete-final').on('click', function() {
			if(parentNode === null) {
				return;
			}
			// fade away habit, then slide the other on delete
			parentNode.animate({
				opacity: '0'
			}, 250, function() {
				$(this).slideUp(350, function() {
					$(this).hide();
				});
			});

			var Habit = Parse.Object.extend('Habit');
			var query = new Parse.Query(Habit);
			query.equalTo('objectId', id);
			query.first({
				success: function(result) {
					deleteAssociatedAlarms(result);
					if (result) {
						result.destroy({
							success: function(result) {
								mixpanel.track('Deleted habit');
							},
							error: function(error) {
								UTILS.log("Error: " + error.code + " " + error.message);
							}
						});
					}
				},
				error: function(error) {
					UTILS.log("Error: " + error.code + " " + error.message);
				}
			});

			/******************************************************************
			* @function deleteAssociatedAlarms
			* @description nested helper function to delete Notifications associated with a Habit
			******************************************************************/
			function deleteAssociatedAlarms (habit) {
				var Notification = Parse.Object.extend('Notification');
				var query2 = new Parse.Query(Notification);
				query2.equalTo('habit', habit);
				query2.find({
					success: function (results) {
						for (var i=0, len=results.length; i<len; i++) {
							results[i].destroy();
						}
					},
					error: function(error) {
						UTILS.log("Error: " + error.code + " " + error.message);
					}
				});
			}

		});
	});
}
