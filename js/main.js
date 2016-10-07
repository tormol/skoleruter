/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/data2.json", function (data) {
      // var defaultView = createDailyView(data["elev"]) // put elev/sfo in second arg
       //var weeklyView = createWeeklyView(defaultView)
        console.log(data)
        //console.log(defaultView);
        printDays(data['elev']);

        var testSchools =["Auglend skole", "Våland skole", "Hundvåg skole"]


        selectSchools(testSchools)


    });
});
