//For fast refrence to current date
var year = new Date().getFullYear();
var month = new Date().getMonth() + 1;
var day = new Date().getDate();

function printDays(dagsObjekt) {
    //console.log(dagsObjekt["Auglend skole"]["2016"]["10"]);
    //$('#units').append('<td></td><td>Jan</td><td>Feb</td><td>Mar</td><td>Apr</td><td>Mai</td><td>Jun</td><td>Jul</td><td>Aug</td><td>Sep</td><td>Okt</td><td>Nov</td><td>Des</td>');
    $.each(dagsObjekt, function(skolenavn, SkoleObj) { //For hver skole
      var row = $("<tr></tr>");
      var navn = $("<th></th>").text(skolenavn);
      navn.addClass("headcol");
      row.append(navn);
      //$('#q').append('<tr><td>' + skolenavn + '</td></tr>')
      $.each(SkoleObj, function(Aar, AarObj) { //For hvert år
        $.each(AarObj, function(Mnd, MndObj) { //For hver Mnd
          if(Mnd != 0 && MndObj.length > 0){ //Hopper over tilfellet når måned = 0
            for(var Dag = 1; Dag <= daysInMonth(Mnd, Aar); Dag++){ //Dag = tallet; MndObj[Dag] = Beskjed
              //Sjekker om datoen er størren enn dagens dato
                if((parseInt(Aar) == parseInt(year) && Mnd >= month && Dag >= day) || parseInt(Aar) > parseInt(year)){
                  var element = $("<td></td>");
                  element.text(Dag + "\n" + Mnd + "\n" + Aar);
                  element.addClass((MndObj[Dag] == undefined) ? "data" : "data green");
                  row.append(element);
                }
            }
          }
        });
      });
      $('#q').append(row);
    });
}

function daysInMonth(month,year) {
  return new Date(year, month, 0).getDate()
}
