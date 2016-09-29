/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/data.json", function (data) {
        console.log(createDailyView(data["elev"])); // put elev/sfo in second arg

    });
});

