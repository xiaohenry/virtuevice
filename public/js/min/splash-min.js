$(document).on("ready",function(){$("#splash-add-habit").on("click",function(){$("body").animate({left:"-=100px",background:"none"},{duration:400,queue:!1}).animate({opacity:.6},350),setTimeout(function(){window.location.href="add.html"},350)})});