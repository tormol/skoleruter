/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/data2.json", function (data) {
      // var defaultView = createDailyView(data["elev"]) // put elev/sfo in second arg
//        console.log(data)
        //console.log(defaultView);

     //   printDays(defaultView);
        //console.log(weeklyView)

        printDays(data['elev'], null, null);

       // var testSchools =["Auglend skole", "Våland skole", "Hundvåg skole"]


     //  selectSchools(testSchools)


    });
});
