
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

    //console.log(dailyObject)

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
    var startTime = new Date().getTime(); //#1
    var day = createDailyObject(data);

    /* Add this line under and #1 over to test the time an operation takes in seconds */
    //console.log((new Date().getTime() - startTime) / 1000 + " seconds elapsed");
    return day;
}

function createDailyObject(data){
    /*
     lager eit object som ser ut som exempelet nedenfor
     NB! objectet vil returnere kun de dagene den kan om, hvis en sier at på dag 47 i januar vil den tro at januar har 47 dager
     NB! objectet returnerer en string verdi for de forskjellige dagene, int hadde gjærne vært bedre?
     NB! Lagt til to do markering hvor dette kan endres, bør skrives en egen func for dette isåfall
     */

    /*
     Return eksempel
     { "Våland" : {
        aars nr : {
          (måned nr:) int : {
            (dags nr) int  : string / Eventuelt int, men hva dag er dette etc? Isåfall egen func
     */

    var dayObject = {};
    $.each(data, function(skolenavn, fridager) {
        var aarsobj = {}, date = {};
        var aar = [], mnd = [];

        //Disse variablene brukes til å passa på at samme måned ikke legges til mer enn en gang
        var forrigeMnd = -1, forrigeAar = -1;
        $.each(fridager, function(_, datoMedBeskrivelse) {
            var sAar = datoMedBeskrivelse[0].substring(0,4), sMnd = datoMedBeskrivelse[0].substring(5,7);
            if(sAar != forrigeAar){ aar.push(sAar); forrigeAar = sAar; }
            if(sMnd != forrigeMnd){ mnd.push(sMnd); forrigeMnd = sMnd; }
            date[datoMedBeskrivelse[0]] = datoMedBeskrivelse[1];
        });

        $.each(aar, function(_, aars) { //per år
            var mndobj = [];
            $.each(mnd, function(test, mnds) { //per mnd
              //Nødvendig for å sikre at alle feltene i en måned får en verdi
                var dagsobject = [];
                $.each(date, function(datoen, besken) { //dato innført
                    var sAar = datoen.substring(0,4), sMnd = datoen.substring(5,7), sDag = datoen.substring(8,10);
                    if (aars == sAar && mnds == sMnd) {
                      if(sDag.charAt(0) == '0') sDag = sDag.substring(1);
                      if(sMnd.charAt(0) == '0') sMnd = sMnd.substring(1);
                      dagsobject[sDag] = besken; // TODO besken == kommentar /les kommentarene på toppen av func
                    }
                });
                mndobj[(mnds.charAt(0) == '0') ? mnds.substring(1) : mnds] = dagsobject; //Cause YES
            });
            aarsobj[aars] = mndobj;
        });
        dayObject[skolenavn] = aarsobj;
    });
    //console.log(dayObject);
    return dayObject;
}

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
