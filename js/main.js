/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
    withStorage();
});

//For testing purposes
function withOutStorage(){
  $.getJSON("php/yngveformatcssklasser.json", function (data) {
    localStorage.setItem("Data", JSON.stringify(data));
    printDays(data, null, null);
  });
}

function withStorage(){
  //Checks if we haven't set the data to a value already
  if (typeof(Storage) == "undefined" || localStorage.getItem("Data") == null) {
    $.getJSON("php/yngveformatcssklasser.json", function (data) {
      //Only saves the item if there is support for it in the browser
      if(typeof(Storage) != "undefined") localStorage.setItem("Data", JSON.stringify(data));
      printDays(data, null, null);
    });
  }
  else {
    var data = JSON.parse(localStorage.getItem('Data'));
    printDays(data, null, null);
  }
}
