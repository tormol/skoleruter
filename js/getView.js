/**
 * Created by Linds on 29/09/2016.
 */
function createDailyView(data){

    return createDailyObject(data)
}

function createDailyObject(data){
    /*
     Return example
     { "Våland" : {
     (måned nr:) int : {
     (dags nr) int  : string / Eventuelt int, men hva dag er dette etc? Isåfall egen func
     */
    var dailyObject = {}
    $.each(data, function(skolenavn, Fridager) {


       dailyObject[skolenavn] = "not done"
    })

    return dailyObject
}

function daysInMonth(month,year) {
    // returns days in given month, 0 value ignored so gives correct month.
    return new Date(year, month, 0).getDate()
}
