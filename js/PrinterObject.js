/* Constructs the printer with the given default values */
var Printer = function () {
  this.activeSchools = null                         //Currently active filtered schools
  this.dateRange = null;                            //The range of days
  this.types = {elev:true, sfo:true, vanlige:true}; //Currently selected types
  this.SkoleObject = null;                          //Full school object
};

/* The print function is prototyped to the Printer variable.
   This means that these functions can now only be called
   through 'PrinterVar.function()', where PrinterVar is a variable
   of type 'new Printer(data)'. By prototyping, we can avoid
   those messy global variables! */
Printer.prototype.print = function() {
    /* Main printer controller */
  this.printInit();
  this.importJsonWithPictures(this);
  var full = "", units = "";
  var First = true;
  var number = 1;

  /* Creates a named refrence to 'this'.
     This has to be done as it doesn't seems
     like the 'this' keyword works in JQuery
     loops */
  var printer = this;

  $.each(this.SkoleObject, function(skolenavn, SkoleObj) { // itterer gjennom alle skolene
      printer.chosenAddSkoleValg(skolenavn); // Legger skolenavnet til dropdown lista over skoler
      var modalnavn = "modal" + number;
      number++;
      var row = "<tr><td class=\"modalstyling\" data-toggle=\"modal\" data-target=\"#" + modalnavn + "\">" + skolenavn + "</td>";

      $.each(SkoleObj, function(Aar, AarObj) { // For hvert år:
          $.each(AarObj, function(Mnd, MndObj) { // For hver måned:
              for(var Dag = 1; Dag <= printer.daysInMonth(Mnd, Aar); Dag++){ // Går gjennom alle dagene i en måned
                  //Sjekker om datoen er valid
                  if(printer.dateInRange(Aar, Mnd, Dag)) {
                      //Legger til den rette enheten
                      if(First) units += printer.getTopText(Dag, Mnd, Aar, MndObj[Dag]);
                      //Legger til dagen
                      if (MndObj[Dag] == undefined) row += "<td></td>";
                      else row += "<td class=" + printer.cssTypes(MndObj[Dag][0], MndObj[Dag][1]) + ">" + printer.generateTooltip(MndObj[Dag][0], MndObj[Dag][1]) + "</td>";
                  }
              }
          });
      });
      // legger til rekken
      row += "</tr>";
      full += row;
      if(First) First = false;
  });
  $('#units').append(units);
  $('#q').append(full);

  var table = $("#fixTable");
  table.tableHeadFixer({
      'left': 1,
      'top': 1
  });
  table.parent().focus();
  // initilize all tooltips
  $('[data-toggle="tooltip"]').tooltip();
  //selectSchools(activeSchools);
  if (printer.types.vanlige === false) printer.hideNormalDays();
  selectSchools(GlobalPrinter.activeSchools);
  //$("#loader").hide();
  $("#modalname").modal('hide');
};

/* Initilize the table for printing,
   Deletes previous entries for redraw.
   Appends an empty cell for the corner */
Printer.prototype.printInit = function() {
    $("#q").empty();
    $('#units').empty();
    $('#units').append($("<td></td>"));
}

/* Adds a schoolname to the chosen-drop-down box */
Printer.prototype.chosenAddSkoleValg = function(skolenavn){
    var valg = "<option value=" + skolenavn + ">" + skolenavn + "</option>"
    $("#skolevalg").append(valg);
    $("#skolevalg").trigger("chosen:updated");
}

/* Returns the amount of days in the given month */
Printer.prototype.daysInMonth = function(month,year) {
    return new Date(year, month, 0).getDate();
}


Printer.prototype.dateInRange = function(Aar, Mnd, Dag){
    /* takes in a day, if a date range is not set: Set start date to TODAY and no end date
       check if date is in range */
       dateRange = this.dateRange;
    if (dateRange == null) {
        // Fetches today's date
        var yearToday = new Date().getFullYear();
        var monthToday = new Date().getMonth() + 1;
        var dayToday = new Date().getDate();

        if((Aar == yearToday && Mnd >= monthToday) || Aar > yearToday){
            if(Mnd == monthToday) return (Dag >= dayToday) ? true : false
            return true
        }
    } else {
        /* Changing to american time units */
        var fDate,lDate,cDate;
        fDate = Date.parse(dateRange["start"].substr(3,2) + "/" + dateRange["start"].substr(0,2) + "/" + dateRange["start"].substr(6,4));
        lDate = Date.parse(dateRange["end"].substr(3,2) + "/" + dateRange["end"].substr(0,2) + "/" + dateRange["end"].substr(6,4));
        cDate = Date.parse(Mnd + "/" + Dag + "/" + Aar);
        if(cDate <= lDate && cDate >= fDate) return true;
    }
    return false
}

/* Gets the description of the day and process and
   compress it, before it returns the results */
Printer.prototype.getTopText = function(dag, mnd, aar, bes){
  var date = dag + "/" + mnd + "/" + aar.substring(2,4) + "\n";
  if(bes != undefined && bes[0] != ",,,OK,,,," && bes[0] != "Ukjent"){
   var desc = bes[0].replace(" ", "");
   var longDesc = ["Planleggingsdag","1.Nyttårsdag","Vinterferie","Palmesøndag","Påskeferie","Skjærtorsdag","Langfredag","1.påskedag","2.påskedag","Off.Høytidsdag","Grunnlovsdag","KristiHimmelfartsdag","1.pinsedag","2.pinsedag","sommerferie"];
   var compactDesc = ["Plan.dag","1.Ny.dag","Vint.fer.","Pal.søn.","Pås.fer.","Skjærtor.","Langfre.","1.påske.","2.påske.","Off.Høy.","Gru.lov.","Kri.Him.","1.pinse.","2.pinse.","som.fer."];
   for(var i = 0; i < longDesc.length; i++ ) {
     if(desc == longDesc[i]) { return "<td class=topBar>" + date + compactDesc[i] + "</td>"; }
   }
   return "<td class=topBar>" + date + desc + "</td>";
 }
  return "<td class=topBar>" + date + "</td>";
}

/* takes in the last entry in each freedayobject, this entry contains a .css class format: E-L-S
   Where E : Elev, L : Lærer, S : SFO, F: : False/filler for format
   Takes a list over types wanted -> Written from selectInfo
   Returns a string argument, type css class with background colour
   IFF type is not in list, will force that entry to be F,
   if the entire list is empty/null will act as if all types are selected
   Adjusts the strings from FreedayObject to match typeList */
Printer.prototype.cssTypes = function (desc, origColour) {

    // TODO force "søndag " and "Lørdag " too? Or fix at PHP end?
    if (origColour == "F-F" || desc == "Søndag" || desc == "Lørdag") return origColour;
    if (this.types.elev === false) origColour = this.setCharAt(origColour, 0, "F");
    if (this.types.sfo === false) origColour = this.setCharAt(origColour, 2, "F");
    return origColour
}
Printer.prototype.setCharAt = function(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

Printer.prototype.generateTooltip = function(str, opts) {
    // str: description, opts: CSS logic format

    if (opts == "E-S") opts = "alle"; // if logic says all
    else {

        //using CSS Logic to generate a string of who the str affects
        temp = "";

        if (opts.substr(0, 1) != 'F') temp += "Elev";
        if (temp != "" && opts.substr(2, 1) != 'F') temp += " og "

        if (opts.substr(2, 1) != 'F') temp += "SFO";
        opts = temp;
    }
  // Generate a tooltip with str and opts
    return '<a href="#" data-toggle="tooltip" title="' + str + ' for ' + opts + '"></a>'
}


/* Hide weekdays where all selected chools are white, or all black if weekend.
   Doesn't access any global variables, but reads and modifies the html */
Printer.prototype.hideNormalDays = function() {
    var weekend = [];
    var hide = [];
    // Find weekends and initialize hide
    // .slice(1) to skip first collumn
    $('#units').children().slice(1).each(function(x, cell) {
        var desc = $(cell).text().split('\n')[1];
        weekend.push(desc === 'Lørdag' || desc === "Søndag");
        hide.push(true);
    });
    // mark noteworthy days
    $("#q tr:visible").each(function(y,row) {
        $(row).children().slice(1).each(function(x,cell) {
            if (hide[x] === true)
                switch (cell.className) {
                    case 'F-F': case '':
                        hide[x] = !weekend[x]; break;
                    case 'E-S':
                        hide[x] = weekend[x]; break;
                    default:
                        hide[x] = false;
                }
          });
    });
    // hide them
    var hide_if = function(x, cell) {
        if (hide[x]) $(cell).hide();
    };
    $('#units').children().slice(1).each(hide_if);
    $("#q tr:visible").each(function(y,row) {
        $(row).children().slice(1).each(hide_if);
    });
}

Printer.prototype.unhideNormalDays = function()  {
    $('#units > *').show();
    $("#q > tr > *").show();// tr:visited makes it slower
}


Printer.prototype.importJsonWithPictures = function(printer) {
  var schoollist = new Array();
  $.getJSON("data/infoomskoler.json", function( data ) {
    var link = "", fileending= "";
    var now = 0;
    $.each(data, function(key, val) {
      if(key == "nettside") link = val;
      else if(key == "fil") fileending = val;
      else{
        $.each(val, function(key, val) {
          var navn = key.split(" ");
          var temps = {navn:navn[0],adresse:val["adresse"],nettside:val["hjemmeside"],posisjon:null,bilde:link+val["bilde"]+fileending,tlf:val["tlf"]};
            schoollist.push(temps);
          })
        }
    });
    printer.afterJsonImport(printer, schoollist);
  });
}

Printer.prototype.afterJsonImport = function(printer, schoollist) {
    var number=1;
    var modals="";
    $.each(printer.SkoleObject, function(skolenavn, SkoleObj) {
      var modalnavn="modal"+number.toString();
      modals+= printer.addModalForSchool(skolenavn, modalnavn, schoollist);
      number++;
    });
    $('#tableDiv').append(modals); // Legge til infosider om skoler
}

Printer.prototype.addModalForSchool = function(skolenavn,modalnavn,skoler) {
  var link="", adresse="", tlf="", hjemmeside="";
  var snavn = skolenavn.split(" ");

  for(var i = 0; i < skoler.length; i++) {
    if (skoler[i]["navn"] == snavn[0]) {
        link=skoler[i]["bilde"];
        adresse=skoler[i]["adresse"];
        tlf=skoler[i]["tlf"];
        hjemmeside=skoler[i]["nettside"];
        break;
    }
  }

  var temp= "<div class=\"modal fade\" id=\""+modalnavn+"\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\"><div class=\"modal-dialog\" role=\"document\"><div class=\"modal-content\"><div class=\"modal-header\">"+
        "<button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\"\>&times;</span></button><h4 class=\"modal-title\" id=\"myModalLabel\">Informasjon om skole</h4></div><div class=\"modal-body\"><div class=\"framed\"><div class=\"prop_left\">"+
            "<img src=\""+link+"\" alt=\""+skolenavn+"\" width=\"200px\"/><div class=\"place\">"+skolenavn+"</div></div><div class=\"prop_right\"><h3>"+skolenavn+"</h3><p>Telefonnummer: "+tlf+"</p></div></div><h1>Informasjon</h1><div class=\"framed\">"+
        "Hjemmeside: <a href=\""+hjemmeside+"\"target=\"_blank\">"+hjemmeside+"</a><br>Adresse: "+adresse+"</div></div>"+
      "<div class=\"modal-footer\"> <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Lukk</button></div></div></div></div>";
  return temp;
}
