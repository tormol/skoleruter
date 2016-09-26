var skolenavn = [];
var partNum = 1; //Number of splits

$(function(){
      var data = $.getJSON("data/data.json", function (data) {
        getSkolenavn(data);
        printListe(createMonthArray(data));
      });
  });

  function getSkolenavn(data){
    $.each(data.fri, function(i2, obj2) {
      skolenavn.push(i2);
    });
  }

  function printListe(liste){
    $('#units').append('<td></td><td>Jan</td><td>Feb</td><td>Mar</td><td>Apr</td><td>Mai</td><td>Jun</td><td>Jul</td><td>Aug</td><td>Sep</td><td>Okt</td><td>Nov</td><td>Des</td>')
    $.each(liste, function( index, value ) {
      $('#q').append("<tr>");
      $('#q').append("<td>" + skolenavn[index+1] + "</td>");
      $.each(value, function(i, val ) {

        //Procedurally builds a dataBlock
        var dataBlock = "<td class=data>";
        for(var i = 0; i < partNum; i++){
          dataBlock += "<div style=width:" + (100/partNum)  + "% class='part " + (val[i] ? "green" : "") + "'></div>"
        }
        dataBlock += "</td>";
        $('#q').append(dataBlock);

      });
      $('#q').append("</tr>");
    });
  }

  /*
  TO DO:
  1. Forskjellige fridager gir forskjellige farger
  2. Oppdeling av måneder for mer oversiktlig visning
  */
  function createMonthArray(data){
    //Tar først enkelte skoledager
    var y = 0;
    var mesterListe = [];
    //Itererer først gjennom hver eneste skole og setter månedene etter det
    $.each(data.fri, function(i2, obj2) {
      if(y++!=0){
        mesterListe[y-2] = [];
        for(var i = 0; i < 12; i++) mesterListe[y-2][i] = []; //Give every month an empty array
        $.each(obj2, function(i, obj) {
          var month = parseInt(i.split("-")[1]);
          var split = parseInt((parseFloat(i.split("-")[2]) / 31) * (partNum - .01)); // Gets the part of the month in 2th
          mesterListe[y-2][month-1][split] = true;
        });
      }
    });

    var last = -1;
    var lastSplit = -1;
    $.each(data.fri.alle, function(i, obj) {
      temp = parseInt(i.split("-")[1])-1;
      split = parseInt((parseFloat(i.split("-")[2]) / 31) * (partNum - .01));
      if(!(temp == last && split == lastSplit)){
        for(var i = 0; i < y-1; i++){
          mesterListe[i][temp][split] = true;
        }
      }
      last = temp;
      lastSplit = split;
    });

    console.log(mesterListe);
    return mesterListe;

  }
