/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/yngveformatcssklasser.json", function (data) {
      // var defaultView = createDailyView(data["elev"]) // put elev/sfo in second arg
//        console.log(data)
        //console.log(defaultView);
 console.log(data)
     //   printDays(defaultView);
        //console.log(weeklyView)

        printDays(data['alt'], null, null);

       // var testSchools =["Auglend skole", "Våland skole", "Hundvåg skole"]


        //  selectSchools(testSchools)


    });
});
