//For fast refrence to current date
var year = new Date().getFullYear();
var month = new Date().getMonth() + 1;
var day = new Date().getDate();

function printDays(dagsObjekt) {
    $('#units').append($("<td></td>").addClass("topBar")); //Appends an empty field for the corner

    var skoleNr = 1;
    $.each(dagsObjekt, function(skolenavn, SkoleObj) { //For hver skole
      var row = $("<tr></tr>");
      var navn = $("<td></td>").text(skolenavn);
      navn.addClass("headcol");
      row.append(navn);
      //$('#q').append('<tr><td>' + skolenavn + '</td></tr>')
      $.each(SkoleObj, function(Aar, AarObj) { //For hvert år
        $.each(AarObj, function(Mnd, MndObj) { //For hver Mnd
       //   if(Mnd != 0 && MndObj.length > 0){ //Hopper over tilfellet når måned = 0
            for(var Dag = 1; Dag <= daysInMonth(Mnd, Aar); Dag++){ //Dag = tallet; MndObj[Dag] = Beskjed
              //Sjekker om datoen er størren enn dagens dato
                if((parseInt(Aar) == parseInt(year) && Mnd >= month && Dag >= day) || parseInt(Aar) > parseInt(year)){

                  if(skoleNr == 1){
                    var dato = $("<td></td>").addClass("topBar").text(Dag + "/" + Mnd + "/" + Aar.substring(2,4) + "\n" + (MndObj[Dag] == undefined || MndObj[Dag] == "Ukjent" ? "" : MndObj[Dag].replace(" ", "")));
                    $('#units').append(dato);
                  }

                  var element = $("<td></td>");
                  element.addClass((MndObj[Dag] == undefined) ? "data" : "data green");
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
        if (($.inArray(skoler, activeSchools)) != -1 || activeSchools.length == 0) {
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
