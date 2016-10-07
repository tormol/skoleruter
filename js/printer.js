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
      //console.log(navn);
      navn.addClass("headcol");
      row.append(navn);
      
      addskolevalg(skolenavn);
      //$('#q').append('<tr><td>' + skolenavn + '</td></tr>')
      $.each(SkoleObj, function(Aar, AarObj) { //For hvert år
        $.each(AarObj, function(Mnd, MndObj) { //For hver Mnd
          if(Mnd != 0 && MndObj.length > 0){ //Hopper over tilfellet når måned = 0
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
          }
        });
      });
      $('#q').append(row);
      skoleNr++;
    });
    $("#fixTable").tableHeadFixer({"left" : 1});
}

function daysInMonth(month,year) {
  return new Date(year, month, 0).getDate()
}

function addskolevalg(skolenavn){
      var valg = $("<option></option>").text(skolenavn);
     $("#skolevalg").append(valg);

}