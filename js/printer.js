//For fast refrence to current date
var year = new Date().getFullYear();
var month = new Date().getMonth() + 1;
var day = new Date().getDate();
var test;
function printDays(dagsObjekt, start, end) {

    var full = "";
    var units = "<td></td>";

    $("#q").empty()
    $('#units').empty()
    //$('#units').append($("<td></td>")); //Appends an empty field for the corner
    //console.log(start)
    var skoleNr = 1;
    $.each(dagsObjekt, function(skolenavn, SkoleObj) { //For hver skole

      var row = "<tr><td>" + skolenavn + "</td>";

      addskolevalg(skolenavn);
      //$('#q').append('<tr><td>' + skolenavn + '</td></tr>')
      $.each(SkoleObj, function(Aar, AarObj) { //For hvert år
        $.each(AarObj, function(Mnd, MndObj) { //For hver Mnd
       //   if(Mnd != 0 && MndObj.length > 0){ //Hopper over tilfellet når måned = 0
            for(var Dag = 1; Dag <= daysInMonth(Mnd, Aar); Dag++){ //Dag = tallet; MndObj[Dag] = Beskjed
              //Sjekker om datoen er størren enn dagens dato
              if(dateInRange(Aar, Mnd, Dag, year, month, day, start, end)) {
              //console.log("triggered")
                if(skoleNr == 1){
                  units += "<td class=topBar>" + getTopText(Dag, Mnd, Aar, MndObj[Dag]) + "</td>";
                }

                if (MndObj[Dag] != undefined) {
                  row += "<td class=no_school></td>";
                }
                else row += "<td></td>";
              }
            }
         // }
        });
      });
      row += "</tr>";
      full += row;
      //$('#q').append(row);
      skoleNr++;
    });
    $('#units').append(units);
    document.getElementById("q").innerHTML = full;

    var table = $("#fixTable");
    table.tableHeadFixer({"left" : 1});

    var parent = table.parent();
    parent.focus();
    // This cannot be done at $(document).ready() because the menu changes size.
    setHeight(parent);
    $(window).resize(function() {
        setHeight(parent);
    })

    test = dagsObjekt
}

function getTopText(dag, mnd, aar, bes){
  var text = dag + "/" + mnd + "/" + aar.substring(2,4) + "\n";
  if(bes != undefined && bes[0] != ",,,OK,,,," && bes[0] != "Ukjent"){
   var temp = bes[0];
   temp = temp.replace(" ", "");
   if(temp == "Planleggingsdag") temp = "Plan.dag";
   if(temp == "1.Nyttårsdag") temp =    "1.Ny.dag";
   if(temp == "Vinterferie") temp =     "Vint.fer.";
   if(temp == "Palmesøndag") temp =     "Pal.søn.";
   if(temp == "Påskeferie") temp =      "Pås.fer.";
   if(temp == "Skjærtorsdag") temp =    "Skjærtor.";
   if(temp == "Langfredag") temp =      "Langfre.";
   if(temp == "1.påskedag") temp =      "1.påske.";
   if(temp == "2.påskedag") temp =      "2.påske.";
   if(temp == "Off.Høytidsdag") temp =  "Off.Høy.";
   if(temp == "Grunnlovsdag") temp =    "Gru.lov.";
   if(temp == "KristiHimmelfartsdag") temp =  "Kri.Him.";
   if(temp == "1.pinsedag") temp =      "1.pinse.";
   if(temp == "2.pinsedag") temp =      "2.pinse.";
   if(temp == "sommerferie") temp =     "som.fer.";
   text += temp;
 }
  return text;
}

// Make the table fill the available space, while avoding scrolling of the whole pake.
function setHeight(div) {
    var total = window.innerHeight;//$(window).height() gives different value before resize
    var above = div.offset().top;
    var below = $("footer").outerHeight(true);
    var available = total - above - below;
    div.height(available);
    //console.log("total: "+total+", above: "+above+", below: "+below+", available: "+available);
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

var activelist = []
// GLOBAL VARIABLES: so it doesn't need to fetch a new reference list each time..
function selectSchools(activeSchools) {

    activelist = activeSchools
    // if reference list is empty, try to fetch a new one
    var listref = generateReferences()


    //iterate through the reference list
    $.each(listref, function(skoler, refs) {
            //check if selected school is in display list,
            // if no schools is in display list, show all schools
        if (($.inArray(skoler, activeSchools)) != -1 || activeSchools == null || activelist.length == 0) {
            // shows school if in display list or if list is empty, else hide
            $(refs).show();
    } else {
            $(refs).hide();
        }
    })
}
function generateReferences() {
    var references = {}
    var listref = {}
    // fetches references, as index:reference
    references = $("#q").children();
    // loops through each reference to fetch schoolname of that references
    $.each(references, function(index, objects) {
        // store each reference in listref with schoolname as index
        listref[objects.firstChild.textContent] = objects;
    })
    return listref;
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
   // console.log(period["start"])
    //console.log(test)
    printDays(test, period["start"], period["end"]);
    console.log("s")
    console.log(activelist);
    selectSchools(activelist);
  // perioden er dictionary av typen {start:dd/mm/yyyy, end:dd/mm/yyyy}
  //start er første dag og end er siste dag i perioden som er valgt
}

// SFO/ELEV/LÆRER
function selectInfo(visningsType) {
    if (visningsType == null) {
        // print all types
        console.log("ALL TYPES SELECTED")
    } else {
        //print the types in the list
        console.log("These types selected: " + visningsType)
    }
}
