/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    var data = $.getJSON("php/data.json", function (data) {
        console.log(createDailyView(data["elev"])); // put elev/sfo in second arg

    });
});

function createDailyView(data){

    return createDailyObject(data)
}
function createDailyObject(data){
  /*
    Return example
           { "Våland" : {
                 (måned nr:) int : {
                            (dags nr) int  : string / Eventuelt int, men hva dag er dette etc?
     */


    return data
}
function daysInMonth(month,year) {
    return new Date(year, month, 0).getDate();
}