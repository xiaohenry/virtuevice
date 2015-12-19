/**
 * @file login.js
 * @description
 */

/** ERROR MESSAGES **/
const INVALID_EMAIL = "Invalid email";
const INVALID_PASSWORD = "Invalid password";
const INVALID_USER = "Invalid user";
const INVALID_LOGIN_DEFAULT = "Error logging in";
const EMAIL_TAKEN = "Email taken";
const INVALID_REGISTER_DEFAULT = "Error registering";
const MATCHING_PASSWORD = "must match";
var UTILS = {
	debug: false,
	log: function(message, obj) {
		if (UTILS.debug) {
			obj = obj ? obj : '';
			console.log(message);
		}
	}
};

$(document).on('ready', function() {
	Parse.initialize('hIP8KstprKjGsmE4VVHT86i2m1VobE8Mc0x7pBi6', 'ixAsSo9S7uCHLCKqdfKhUt1ZNcOBGX129Toy8QyO');
	bindEventListeners();
});

/**
 @function bindEventListeners
 **/
function bindEventListeners() {
	$('#login-email, #register-email').on('blur', function() {
		if (!$(this).val()) {
			return;
		}
		validateEmail($(this));
	});

	$('#login-pw, #register-pw, #register-pw-confirm').on('blur', function() {
		if (!$(this).val()) {
			return;
		}
		validatePassword($(this));
	});

	$('#login-email, #login-pw').on('keyup', function(e) {
    	if (e.which == 13 || e.keyCode == 13) {
    		$("#login-button").click();
    	}
	});

	$('#register-email, #register-pw, #register-pw-confirm').on('keyup', function(e) {
		if (e.which == 13 || e.keyCode == 13) {
			$("#register-button").click();
		}
	});

	$('#login-button').on('click', function() {
		var validEmail = validateEmail($('#login-email'));
		var validPassword = validatePassword($('#login-pw'));
		if (validEmail && validPassword) {
			var email = $('#login-email').val();
			var password = $('#login-pw').val();
			login(email, password);
		} else {
			$('.login-submit-error').text(INVALID_LOGIN_DEFAULT);
			$('.login-submit-error').css('visibility', 'visible');
			setTimeout(function() {
				$('.login-submit-error').css('visibility', 'hidden');
			}, 3000);
		}
	});

	$('#register-button').on('click', function() {
		var validEmail = validateEmail($('#register-email'));
		var validPassword= validatePassword($('#register-pw'));
		var validPasswordConfirm = validatePassword($('#register-pw-confirm'));
		var matching = ($('#register-pw').val() === $('#register-pw-confirm').val());

		if (validEmail && validPassword && matching) {
			var email = $('#register-email').val();
			var password = $('#register-pw').val();
			register(email, password);
			return;
		} else if (!matching) {
			$('.register-pw-error').text(MATCHING_PASSWORD).show();
			$('.register-pw-confirm-error').text(MATCHING_PASSWORD).show();
		}
		$('.register-submit-error').text(INVALID_REGISTER_DEFAULT);
		$('.register-submit-error').css('visibility', 'visible');
		setTimeout(function() {
			$('.register-submit-error').css('visibility', 'hidden');
		}, 3000);
	});

}

/**
 * @function validateEmail
 */
function validateEmail(email) {
	var val = email.val();
	if (!checkEmailFormat(val)) {
		UTILS.log('Invalid email');
		$('.' + email.attr('id') + '-error').show();
		return false;
	} else {
		$('.' + email.attr('id') + '-error').hide();
		return true;
	}
}
/**
 * @function validatePassword
 */
function validatePassword(password) {
	var val = password.val();
	if (!val || !val.trim().length) {
		UTILS.log('Invalid password');
		$('.' + password.attr('id') + '-error').show();
		return false;
	} else {
		$('.' + password.attr('id') + '-error').hide();
		return true;
	}
}

/**
 @function checkEmailFormat
**/
function checkEmailFormat(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}

/**
 * @function register
 * @description Parse register
 */
function register(email, password) {
	var user = new Parse.User();
	user.set('username', email);
	user.set('email', email);
	user.set('password', password);
	user.signUp(null, {
		success: function(user) {
			UTILS.log('Registered successfully ' + user);
			mixpanel.track('User registered');
			// window.location.href = 'list.html';
			window.location.href = 'splash.html';
		},
		error: function(user, error) {
			UTILS.log(user);
			UTILS.log(error);
			$('.register-submit-error').text(error.message);
			$('.register-submit-error').css('visibility', 'visible');
			setTimeout(function() {
				$('.register-submit-error').css('visibility', 'hidden');
			}, 3000);
		}
	})
}

/**
 * @function login
 * @description Parse login
 */
function login(email, password){
	Parse.User.logIn(email, password, {
		success: function(user) {
			UTILS.log('Successfully logged in ' + user);
			mixpanel.track('User logged in');
			var userId = user.id;
			var Habit = Parse.Object.extend('Habit');
			var query = new Parse.Query(Habit);
			var destination = '';
			query.equalTo('userId', userId);
			query.first({
				success: function(result) {
					if (result) {
						window.location.href = 'list.html';
					} else {
						window.location.href = 'splash.html';
					}
				},
				error: function(error) {
					window.location = 'list.html';
				}
			});
		},
		error: function(user, error) {
			$('.login-submit-error').text(error.message);
			$('.login-submit-error').css('visibility', 'visible');
			setTimeout(function() {
				$('.login-submit-error').css('visibility', 'hidden');
			}, 3000);
		}
	});

}
