//For fast refrence to current date
var year = new Date().getFullYear();
var month = new Date().getMonth() + 1;
var day = new Date().getDate();
var test;
function printDays(dagsObjekt, start, end) {
    $("#q").empty()
    $('#units').empty()
    $('#units').append($("<td></td>").addClass("topBar")); //Appends an empty field for the corner
    //console.log(start)
    var skoleNr = 1;
    $.each(dagsObjekt, function(skolenavn, SkoleObj) { //For hver skole
      var row = $("<tr></tr>");
      var navn = $("<td></td>").text(skolenavn);
      //console.log((start == null) ? null : start.substr(3,2))
      //  console.log((start == null) ? null : start.substr(6,4))
      navn.addClass("headcol");
      row.append(navn);

      addskolevalg(skolenavn);
      //$('#q').append('<tr><td>' + skolenavn + '</td></tr>')
      $.each(SkoleObj, function(Aar, AarObj) { //For hvert år
        $.each(AarObj, function(Mnd, MndObj) { //For hver Mnd
       //   if(Mnd != 0 && MndObj.length > 0){ //Hopper over tilfellet når måned = 0
            for(var Dag = 1; Dag <= daysInMonth(Mnd, Aar); Dag++){ //Dag = tallet; MndObj[Dag] = Beskjed
              //Sjekker om datoen er størren enn dagens dato

                if(dateInRange(Aar, Mnd, Dag, year, month, day, start, end)) {
                 //   console.log("triggered")
                  if(skoleNr == 1){
                    var dato = $("<td></td>").addClass("topBar").text(Dag + "/" + Mnd + "/" + Aar.substring(2,4) + "\n" + (MndObj[Dag] == undefined || MndObj[Dag] == "Ukjent" ? "" : MndObj[Dag].replace(" ", "")));
                    $('#units').append(dato);
                  }

                  var element = $("<td></td>");
                  element.addClass((MndObj[Dag] == undefined) ? "data" : "data green");
                   // console.log("triggered")
                  row.append(element);
                }
            }
         // }
        });
      });
      $('#q').append(row);
      skoleNr++;
    });
    $("#fixTable").tableHeadFixer({"left" : 1});
    test = dagsObjekt
}

function dateInRange(Aar, Mnd, Dag, yearToday, monthToday, dayToday, start, end){
    //console.log(start == null)
    if (start == null || end == null) {
        if((Aar == yearToday && Mnd >= monthToday) || Aar > year){

            if(Mnd == monthToday) {
                return (Dag >= dayToday) ? true : false
            }
            return true
        }

    }else if (start != null && end != null){


        var fDate,lDate,cDate;

        // CHANGING TO RETARDED AMERICAN TIME UNITs
        fDate = Date.parse(start.substr(3,2) + "/" + start.substr(0,2) + "/" + start.substr(6,4));
        lDate = Date.parse(end.substr(3,2) + "/" + end.substr(0,2) + "/" + end.substr(6,4));
        cDate = Date.parse(Mnd + "/" + Dag + "/" + Aar);


        if((cDate <= lDate && cDate >= fDate)) {
            return true;
        }


    }


    return false
}

/*

a function that takes in list of active schools.
It'll hide all the schools that it doesn't need?


 */
var listref = {}
// GLOBAL VARIABLES: so it doesn't need to fetch a new reference list each time..
function selectSchools(activeSchools) {
    // if reference list is empty, try to fetch a new one
    if (Object.keys(listref).length == 0) { generateReferences()}


    //iterate through the reference list
    $.each(listref, function(skoler, refs) {
            //check if selected school is in display list,
            // if no schools is in display list, show all schools
        if (($.inArray(skoler, activeSchools)) != -1 || activeSchools == null) {
            // shows school if in display list or if list is empty, else hide
            $(refs).show();
    } else {
            $(refs).hide();
        }
    })
}
function generateReferences() {
    var references = {}
    // fetches references, as index:reference
    references = $("#q").children();
    // loops through each reference to fetch schoolname of that references
    $.each(references, function(index, objects) {
        // store each reference in listref with schoolname as index
        listref[objects.firstChild.textContent] = objects;
    })

}
function daysInMonth(month,year) {
  return new Date(year, month, 0).getDate()
}

function addskolevalg(skolenavn){
      var valg = $("<option></option>").text(skolenavn);
     $("#skolevalg").append(valg);
     $("#skolevalg").trigger("chosen:updated");
}

function filterDates(period){
  // TODO: Implementer filtrering på dato av tabell
    console.log(period["start"])
    console.log(test)
    printDays(test, period["start"], period["end"]);
  // perioden er dictionary av typen {start:dd/mm/yyyy, end:dd/mm/yyyy}
  //start er første dag og end er siste dag i perioden som er valgt
}