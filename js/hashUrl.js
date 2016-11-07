

function doHashURL() {
    hashObject = {}
  
    hashObject[0] = activeSchools;
    hashObject[1] = dateRange;
    hashObject[2] = types;

    window.location.hash = JSON.stringify(hashObject)
}
function existHash() {
    if (window.location.hash) return true; // reason this is own func is cause there might be other situations to be added later
    return false;
}


function useHashURL() {
    //this has to happen before print, as print depends on it.. (otherwise double draw)

    var hashObject = JSON.parse(window.location.hash.substring(1))

    // sets active schools from hash
    fetchFirstWord(hashObject[0])

    activeSchools = hashObject[0]
    //sets dateRange
    dateRange = hashObject[1] //the calender will auto set it to DateRange aswell if it != null.
   // console.log(dateRange)
    //sets types from hash
    types = hashObject[2] // this is for the table generation, the two below is for visual
    $("#vis_elev").prop('checked', hashObject[2].elev);
    $("#vis_sfo").prop('checked', hashObject[2].sfo);
    //printT();
}
function useHashURLChosen() {
    // This has to happen after print has run, as the chosenList is dependent on it.

    var hashObject = JSON.parse(window.location.hash.substring(1))
    // updates Chosen for schools
    fetchFirstWord(hashObject[0])
    $("#skolevalg").val(hashObject[0])
    $("#skolevalg").trigger("chosen:updated");

  

}
function fetchFirstWord(someStringArray) {
    // first word required for value...
    $.each(someStringArray, function (index, someString) {
        someStringArray[index] = someString.split(" ")[0]
    })
    
    return someStringArray
}