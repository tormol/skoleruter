/* An attempt to make Printer a lot more readable and structured */

// Pool of Global Variables, anything here needs to be commented and reasoned for

var activeSchools = null; // this is requred by prints(), it also needs to  be saved between multiple print() calls
var dateRange = null; // used by printRow
var typeList = null; // used by printRow TODO Add default value
var SkoleObject = null;

var skolerinfo = importJsonWithPictures(); //Hente info fra json
var modals="";
var number=1;

function printT() {

    prints(SkoleObject)
    selectSchools(activeSchools);
}
function prints(data) {
    if (SkoleObject == null) SkoleObject = data;

    /* Main printer controller */
    printInit();

    var full = "", units = "";
    var First = true;

    $.each(SkoleObject, function(skolenavn, SkoleObj) { // itterer gjennom alle skolene
        modalnavn="modal"+number.toString();
        number++;
        modals+= addModalForSchool(skolenavn,modalnavn,skolerinfo);

        chosenAddSkoleValg(skolenavn); // Legger skolenavnet til dropdown lista over skoler
        var row = "<tr><td data-toggle=\"modal\" data-target=\"#"+modalnavn+"\">" + skolenavn + "</td>";

        $.each(SkoleObj, function(Aar, AarObj) { // For hvert år:
            $.each(AarObj, function(Mnd, MndObj) { // For hver måned:
                for(var Dag = 1; Dag <= daysInMonth(Mnd, Aar); Dag++){ // Går gjennom alle dagene i en måned
                    //Sjekker om datoen er valid
                    if(dateInRange(Aar, Mnd, Dag)) {
                        //Legger til den rette enheten
                        if(First) units += getTopText(Dag, Mnd, Aar, MndObj[Dag]);
                        //Legger til dagen
                        if (MndObj[Dag] == undefined) row += "<td></td>";
                        else row += "<td class=" + cssTypes(MndObj[Dag][1]) + ">" + generateTooltip(MndObj[Dag][0], MndObj[Dag][1]) + "</td>";
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

    document.body.innerHTML+=modals;

    var table = $("#fixTable");
    table.tableHeadFixer({"left" : 1});
    var parent = table.parent();
    parent.focus();
    // This cannot be done at $(document).ready() because the menu changes size.
    setHeight(parent);
    $(window).resize(function() {
      setHeight(parent);
    })
    // initilize all tooltips
    $('[data-toggle="tooltip"]').tooltip()

}
function generateTooltip(str, opts) {
    // str: description, opts: CSS logic format
    if (opts == "E-L-S") opts = "alle"; // if logic says all

    else {
        //using CSS Logic to generate a string of who the str affects
        temp = ""
        if (opts.substr(0, 1) != 'F') temp += "Elev";
        if (temp != "" && opts.substr(2, 1) != 'F') temp += ", "
        if (opts.substr(2, 1) != 'F') temp += "Lærer";
        if (temp != "" && opts.substr(4, 1) != 'F') temp += ", "
        if (opts.substr(4, 1) != 'F') temp += "SFO";
        opts = temp;
    }

  // Generate a tooltip with str and opts
    return '<a href="#" data-toggle="tooltip" title="' + str + ' for ' + opts + '"></a>'
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
  return "<td class=topBar>" + text + "</td>";
}

function printInit() {
    /* Initilize the table for printing,
     * Must delete previous entries for redraw, or will just add to table */
    $("#q").empty()
    $('#units').empty()
    $('#units').append($("<td></td>")); //Appends an empty field for the corner
}

function chosenAddSkoleValg(skolenavn){
    var valg = $("<option></option>").text(skolenavn);
    $("#skolevalg").append(valg);
    $("#skolevalg").trigger("chosen:updated");
}
function dateInRange(Aar, Mnd, Dag){
    /* takes in a day, if a date range is not set: Set start date to TODAY and no end date
     * check if date is in range.
     * */

    if (dateRange == null) {
        // Henter dagens dato

        var yearToday = new Date().getFullYear();
        var monthToday = new Date().getMonth() + 1;
        var dayToday = new Date().getDate();
        if((Aar == yearToday && Mnd >= monthToday) || Aar > yearToday){

            if(Mnd == monthToday) {
                return (Dag >= dayToday) ? true : false
            }
            return true
        }

    }   else {

        var fDate,lDate,cDate;
        // CHANGING TO RETARDED AMERICAN TIME UNITs
        fDate = Date.parse(dateRange["start"].substr(3,2) + "/" + dateRange["start"].substr(0,2) + "/" + dateRange["start"].substr(6,4));
        lDate = Date.parse(dateRange["end"].substr(3,2) + "/" + dateRange["end"].substr(0,2) + "/" + dateRange["end"].substr(6,4));
        cDate = Date.parse(Mnd + "/" + Dag + "/" + Aar);
        if((cDate <= lDate && cDate >= fDate)) {
            return true;
        }
    }
    return false
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
function selectSchools(ActiveSchools) {
    activeSchools = ActiveSchools
    // if reference list is empty, try to fetch a new one
    var listref = generateReferences()


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

    var listref = {}
    // fetches references, as index:reference
    var references = $("#q").children();
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
function filterDates(period){
    dateRange = period;


    //  printDays(test, period["start"], period["end"]);
    printT()
    // selectSchools(activeSchools);
}
function selectInfo(visningsType) {
    typeList = visningsType
    if (typeList != null && typeList.length == 3) { // IF nothing selected
        typeList = [] // make empty
    }


    printT()
    //printDays(test, startRange, endRange);
    //  selectSchools();
}
function cssTypes(origColour) {
    // takes in the last entry in each freedayobject, this entry contains a .css class format: E-L-S
    // Where E : Elev, L : Lærer, S : SFO, F: : False/filler for format
    // Takes a list over types wanted -> Written from selectInfo
    // Returns a string argument, type css class with background colour
    // IFF type is not in list, will force that entry to be F,
    // if the entire list is empty/null will act as if all types are selected
    // Adjusts the strings from FreedayObject to match typeList


        $.each(typeList, function(index, type) {

            switch(type) {
                case "SFO":
                    origColour =setCharAt(origColour, 4, "F")
                    break;
                case "Elev":
                    origColour = setCharAt(origColour, 0, "F")
                    break;
                case "Lærer":
                    origColour = setCharAt(origColour, 2, "F")
                    break;

            }
        });

    return origColour
}
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}
function addModalForSchool(skolenavn,modalnavn,skoler){//Legg til modal for en skole
  var link="";
  var adresse="";
  var tlf="";
  var hjemmeside="";
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
            "<div class=\"modal-footer\"><form class=\"prop_left\" action=\"\">Meld deg på epostvarsling:<br>Email:<input type=\"text\" name=\"email\" value=\"\"> <input type=\"submit\" value=\"Send\"></form> <button type=\"button\" class=\"btn btn-default\" data-dismiss=\"modal\">Close</button></div></div></div></div>";
  return temp;
}
function importJsonWithPictures(){ //Importer json med skoleinfo
  var schoollist =new Array();
  $.ajaxSetup({
    async: false
});
  $.getJSON( "data/infoomskoleraleksander.json", function( data ) {
    var link = "";
    var fileending="";
    var now=0;
    $.each( data, function( key, val ) {
      if(key=="nettside"){
        link=val;
      }
      else if(key=="fil"){
        fileending=val;
      }
      else{
        $.each( val, function( key, val ) {
            var navn =key.split(" ");
            var temps= {navn:navn[0],adresse:val["adresse"],nettside:val["hjemmeside"],posisjon:null,bilde:link+val["bilde"]+fileending,tlf:val["tlf"]};
            schoollist.push(temps);
          })
        }
    });
});
return schoollist;
//skolerliste= schoollist;
}
