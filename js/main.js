/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/data.json", function (data) {
       var defaultView = createDailyView(data["elev"]) // put elev/sfo in second arg
       //var weeklyView = createWeeklyView(defaultView)

        //console.log(defaultView);
        printDays(defaultView);
        //console.log(weeklyView)
    });
});
