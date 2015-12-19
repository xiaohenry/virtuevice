

var Parse = require('parse-cloud-express').Parse;


Parse.Cloud.define("hello", function(request, response) {
  console.log('Ran cloud function.');
  // As with Parse-hosted Cloud Code, the user is available at: request.user
  // You can get the users session token with: request.user.getSessionToken()
  // Use the session token to run other Parse Query methods as that user, because
  //   the concept of a 'current' user does not fit in a Node environment.
  //   i.e.  query.find({ sessionToken: request.user.getSessionToken() })...
  response.success("Hello world! " + (request.params.a + request.params.b));
});


Parse.Cloud.beforeSave('TestObject', function(request, response) {
  console.log('Ran beforeSave on objectId: ' + request.object.id);
  response.success();
});

Parse.Cloud.afterSave('TestObject', function(request, response) {
  console.log('Ran afterSave on objectId: ' + request.object.id);
});

Parse.Cloud.beforeDelete('TestObject', function(request, response) {
  console.log('Ran beforeDelete on objectId: ' + request.object.id);
  response.success();
});

Parse.Cloud.afterDelete('TestObject', function(request, response) {
  console.log('Ran afterDelete on objectId: ' + request.object.id);
});



// Parse.Cloud.job('clearDoneToday', function(request, response) {
//     Parse.Cloud.useMasterKey();
//
//     var today = new Date().getDay();
//     var dayOfWeek = ['sun','mon','tues','wed','thu','fri','sat'];
//
//
//     var habit = Parse.Object.extend('Habit');
//     var query = new Parse.Query(habit);
//     today = (today === 0) ? 6 : today--;
//     query.equalTo("dayOfWeek",dayOfWeek[today]);
//     query.find({
//         success: function(results) {
//             for(var i = 0, len=results.length; i < len; i++){
//                 if(results[i].get('doneToday') < results[i].get('timesPerDay')){
//                     results[i].set("currentRecord", 0);
//                 }
//                 results[i].set("doneToday",0);
//                 mixpanel.track('Resetting non-zero habit');
//             }
//             Parse.Object.saveAll(results, {
//                 success: function(result){
//                     console.log("Saved");
//                 },
//                 error: function(error){
//                     console.log("Failed");
//                 }
//             });
//         },
//         error: function(){
//             console.log("Failed");
//         }
//     });
// });
