/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/data.json", function (data) {
       var defaultView = createDailyView(data["l\u00e6rer"]) // put elev/sfo in second arg



        console.log(defaultView)
    });
});

