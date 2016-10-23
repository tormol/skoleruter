/**
 * Created by Linds on 29/09/2016.
 */


$(function(){
  addColours();
  withStorage()
});

//For testing purposes
function withOutStorage(){
  $.getJSON("php/yngveformatcssklasser.json", function (data) {
    localStorage.setItem("Data", JSON.stringify(data));
    prints(data);
  });
}

function withStorage(){
  //Checks if we haven't set the data to a value already
  if (typeof(Storage) == "undefined" || localStorage.getItem("Data") == null) {
    $.getJSON("php/yngveformatcssklasser.json", function (data) {
      //Only saves the item if there is support for it in the browser
      if(typeof(Storage) != "undefined") localStorage.setItem("Data", JSON.stringify(data));
      prints(data);
    });
  }
  else {
    var data = JSON.parse(localStorage.getItem('Data'));
    prints(data);
  }
}