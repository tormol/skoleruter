function doHashURL() {
    hashObject = {}

    hashObject[0] = activeSchools;
    hashObject[1] = dateRange;
    hashObject[2] = types;

    var settings = JSON.stringify(hashObject);
    window.location.hash = settings;
    /* Stores settings if there were no hash in the link to begin with */
    if(canStoreChanges) storeSettings(settings);
}
function existHash() {
    if (window.location.hash) return true; // reason this is own func is cause there might be other situations to be added later
    return false;
}

function getHashString(){
  return window.location.hash.substring(1);
}


function useHashURL() {
    //this has to happen before print, as print depends on it.. (otherwise double draw)
    updateSettings(JSON.parse(window.location.hash.substring(1)));
}

/* This function updates the settings in the view based on a gives JSON.
   Required to be in a seperate function because user settings loaded from
   the storage is gotten in the same format */
function updateSettings(settings){
  // sets active schools from hash
  fetchFirstWord(settings[0])

  activeSchools = settings[0]
  //sets dateRange
  dateRange = settings[1] //the calender will auto set it to DateRange aswell if it != null.
  //sets types from hash
  types = settings[2] // this is for the table generation, the two below is for visual
  $("#vis_elev").prop('checked', settings[2].elev);
  $("#vis_sfo").prop('checked', settings[2].sfo);
}

function useHashURLChosen() {
    postUpdateSettings(JSON.parse(window.location.hash.substring(1)));
}

/* Updates the chosen visuals, so selected schools are putted
   in the textbox */
function postUpdateSettings(settings){
  fetchFirstWord(settings[0]);
  $("#skolevalg").val(settings[0]);
  $("#skolevalg").trigger("chosen:updated");
}

function fetchFirstWord(someStringArray) {
    // first word required for value...
    $.each(someStringArray, function (index, someString) {
        someStringArray[index] = someString.split(" ")[0]
    })

    return someStringArray
}
