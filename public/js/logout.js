/**
 * @file logout.js
 * @description
 */

$(document).on('ready', function() {
	Parse.initialize('hIP8KstprKjGsmE4VVHT86i2m1VobE8Mc0x7pBi6', 'ixAsSo9S7uCHLCKqdfKhUt1ZNcOBGX129Toy8QyO');

	var currentUser = Parse.User.current();
	if(!currentUser){
		location.href = "index.html";
	}
	$('#logout-button').on('click', function() {
		logout();
	});
});

/**
 * @function logout
 * @description Parse logout
 **/
function logout() {
	Parse.User.logOut();
	location.href = "index.html";
 }
