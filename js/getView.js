/**
 * Created by Linds on 29/09/2016.
 */
function createWeeklyView(dailyObject) {
    return createWeeklyObject(dailyObject)
}
function createWeeklyObject(dailyObject){
    /*
     Våland : {
     Årsnr : ukenr
     }
     }
     */
  //  console.log(skolenavn)
    var weeklyObject = {}

    console.log(dailyObject)

         $.each(dailyObject, function(skolenavn, aars) {
            var aarsobj = {}

             $.each(aars, function(aar, dag) {
                    var ukesobj = {}
                    for(var i = 1; i <= weeksInYear(aar);i++) {
                        $.each(dag, function(mnd, dag) {
                            //console.log(dailyObject[skolenavn][aar][mnd])
                            ukesobj[i] = true
                        })

                    }
                 aarsobj[aar] = ukesobj
                 })
             weeklyObject[skolenavn] = aarsobj

       })

   // console.log(dailyObject)

    return weeklyObject
}

function createDailyView(data){

    return createDailyObject(data)
}

function createDailyObject(data){
    /*
     lager eit object som ser ut som exempelet nedenfor
     NB! objectet vil returnere kun de dagene den kan om, hvis en sier at på dag 47 i januar vil den tro at januar har 47 dager
     NB! objectet returnerer en string verdi for de forskjellige dagene, int hadde gjærne vært bedre?
     NB! Lagt til to do markering hvor dette kan endres, bør skrives en egen func for dette isåfall
     */

    /*
     Return example
     { "Våland" : {
     aars nr : {
     (måned nr:) int : {
     (dags nr) int  : string / Eventuelt int, men hva dag er dette etc? Isåfall egen func
     */

    var dayObject = {}
    $.each(data, function(skolenavn, fridager) {

        var aarsobj = {}

        var date = {}
        var aar = []
        var mnd = []

        $.each(fridager, function(_, datoMedBeskrivelse) {
            aar.push(datoMedBeskrivelse[0].split('-')[0])
            mnd.push(datoMedBeskrivelse[0].split('-')[1])
            date[datoMedBeskrivelse[0]] = datoMedBeskrivelse[1]

        })

         aar = aar.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        })
         mnd = mnd.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        })




        $.each(aar, function(_, aars) { //per år


            var mndobj = []
            $.each(mnd, function(_, mnds) { //per mnd
                var dagsobject= []

            $.each(date, function(datoen, besken) { //dato innført

                if (aars == datoen.split("-")[0]) {

                    if (mnds == datoen.split("-")[1]) {
                        dagsobject[datoen.split("-")[2]] = besken // TODO besken == kommentar /les kommentarene på toppen av func
                    }
                }
            })
                mndobj[mnds] = dagsobject
        })
            aarsobj[aars] = mndobj
})

        dayObject[skolenavn] = aarsobj
    })


    return dayObject
}
/*
 function daysInMonth(month,year) {
 // returns days in given month, 0 value ignored so gives correct month.
 return new Date(year, month, 0).getDate()
 }
 */
// http://stackoverflow.com/questions/18478741/get-weeks-in-year
function getWeekNumber(d) {
    // Copy date so don't modify original
    d = new Date(+d);
    d.setHours(0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
}
function weeksInYear(year) {
    var month = 11, day = 31, week;

    // Find week that 31 Dec is in. If is first week, reduce date until
    // get previous week.
    do {
        d = new Date(year, month, day--);
        week = getWeekNumber(d)[1];
    } while (week == 1);

    return week;
}