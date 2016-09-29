/**
 * Created by Linds on 29/09/2016.
 */
function createDailyView(data){

    return createDailyObject(data)
}

function createDailyObject(data){
 /*
 lager eit object som ser ut som exempelet nedenfor
 NB! Objectet vil alltid returnere 31 dager per mnd, må endres på visning
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
        var dagsobject= {}
        var aarsobj = {}
        var mndObj = {}
        var date = {}
        var aar = []

        $.each(fridager, function(_, datoMedBeskrivelse) {
            aar.push(datoMedBeskrivelse[0].split('-')[0])
            //date[((datoMedBeskrivelse[0].split('-')).splice(0, 3)).join()] = datoMedBeskrivelse[1]
            date[datoMedBeskrivelse[0]] = datoMedBeskrivelse[1]

        })

        var aar = aar.filter(function(elem, index, self) {
            return index == self.indexOf(elem);
        })


        $.each(aar, function(_, aars) {
            $.each(date, function(datoen, besken) {
                 if (aars == datoen.split("-")[0]) {
                    dagsobject[datoen.split("-")[2]] = besken // TODO besken == kommentar /les kommentarene på toppen av func

                     mndObj[parseInt(datoen.split("-")[1])] = dagsobject

                    aarsobj[aars] = mndObj

                 }
            })

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