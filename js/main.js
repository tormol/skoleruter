//Defines global printer and printer
var GlobalPrinter;
var GlobalStorage;

$(function (){
  $("#modalname").modal('show');
})

$(function () {
    GlobalPrinter = new Printer();
    GlobalStorage = new StorageManager();

    /* Menu shrinks after this, but footer stays at the bottom. */
    var parent = $('#tableDiv');
    setHeight(parent);
    $(window).resize(function() { setHeight(parent); });

    GlobalStorage.loadSettings();
    addColours();
    GlobalStorage.getJSON();
});

/* Dersom man ønsker å endre på hva som skjer etter at dataene er lastet
   inn, plasseres det her */
function afterGet(data){
  GlobalPrinter.SkoleObject = data;
  GlobalPrinter.print();

  GlobalStorage.postLoadSettings();
    //prints(data);
    //if (existHash()) useHashURLChosen();
    //else postLoadSettings();
}

// Make the table fill the available height, while avoding scrolling of the whole page.
// If tat leaves too little space for content, allow more and more parts to scroll out of view.
function setHeight(div) {
    var total_height = window.innerHeight;//$(window).height() gives different value before resize
    var above = div.offset().top;
    var below = $('footer').outerHeight(true);
    var row_height = $('#units').outerHeight(true);
    var available = total_height - above - below;
    if (available / row_height - 1 >= 5) {
        // header, nav, thead & footer is effectively fixed
        div.height(available);
    } else if (total_height / row_height - 1 >= 2) {
        // header, nav & footer scroll out, thead is absolute
        div.height(total_height);
    } else {
        // everything scrolls
        div.css('height', '');// removes it
    }
}
