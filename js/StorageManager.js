var StorageManager = function () {
  this.JSON = null;
  this.canStoreChanges = true;
};

/* afterGet is defined in main. This function have to be called
   because Jquery's getJSON is an asynchronous method. Having a
   waiting loop in main that wait for value to change isn't a
   possibility either, as most browsers are single threaded */
StorageManager.prototype.getJSON = function() {
  var JsonPath = "php/yngveformatcssklasser.json";

  var manager = this;
  // Henter versjons-nummeret til JSON filen
  // Henter versjons-nummeret til JSON filen
  $.get('php/JsonVersjon.txt', function(ver) {
    /* Dersom nettleseren ikke støtter localStorage, er det ikke nødvendig å sjekke
       om variabler er lagret */
      if (typeof(Storage) == "undefined"){
        $.getJSON(JsonPath, function (data) { manager.JSON = data; afterGet(data); });
        return;
      }
			/* Dersom versjons-nummeret ikke er satt, eller det har blitt endret siden forrige gang,
         hentes json filen på nytt og versjon og json-data lagres */
         var JSONData = manager.loadJSON();
   	 if(manager.getVersion() == null || manager.getVersion() != ver || JSONData == null){
        $.getJSON(JsonPath, function (data) {
          manager.setVersion(ver);
          manager.saveJSON(data);
          manager.JSON = data;
          afterGet(data);
        });
      }
      /* Dersom versjons-nummeret er rett, og dataen ikke har blitt slettet siden forrige
         gang, så hentes JSON filen i fra lokal disk, i stedenfor å hentes fra server */
         else{
             manager.JSON = JSONData;
             afterGet(JSONData);
      }
  }, 'text');
}

/* Updates the view */
StorageManager.prototype.loadSettings = function(){
  if (window.location.hash) { // if this is not true, use local storage for user choices
      /* Updates the view based on hash */
      this.updateView(JSON.parse(window.location.hash.substring(1)));
      this.canStoreChanges = this.settingsIsHash();
  }
  else this.loadSettings();
}

StorageManager.prototype.settingsIsHash = function(){
  var settings = localStorage.getItem("Settings");
  if(settings == null) return false;
  else return (settings == window.location.hash.substring(1));
}

StorageManager.prototype.updateView = function(settings){
  // sets active schools from hash
  this.fetchFirstWord(settings[0])

  GlobalPrinter.activeSchools = settings[0]
  //sets dateRange
  GlobalPrinter.dateRange = settings[1] //the calender will auto set it to DateRange aswell if it != null.
  //sets types from hash
  GlobalPrinter.types = settings[2] // this is for the table generation, the two below is for visual
  $("#vis_elev").prop('checked', settings[2].elev);
  $("#vis_sfo").prop('checked', settings[2].sfo);
}

StorageManager.prototype.postLoadSettings = function(){
  var Json = "";
  if (window.location.hash) {
    Json = JSON.parse(window.location.hash.substring(1));
  }
  else {
    var settings = localStorage.getItem("Settings");
    if(settings != null) Json = JSON.parse(settings);
  }
  this.fetchFirstWord(Json[0]);
  $("#skolevalg").val(Json[0]);
  $("#skolevalg").trigger("chosen:updated");

  /* After updating the chosen drop-down, the function that
     update school selection is runned. This one is defined
     as one of the handlers for chosen and can be found in
     'ChosenHandlers.js' */
  selectSchools(GlobalPrinter.activeSchools);
}

StorageManager.prototype.fetchFirstWord = function(arr) {
    // first word required for value...
    $.each(arr, function (index, someString) {
        arr[index] = someString.split(" ")[0];
    });
    return arr;
}

StorageManager.prototype.updateSettings = function() {
    hashObject = {}

    hashObject[0] = GlobalPrinter.activeSchools;
    hashObject[1] = GlobalPrinter.dateRange;
    hashObject[2] = GlobalPrinter.types;

    var settings = JSON.stringify(hashObject);
    window.location.hash = settings;
    /* Stores settings if there were no hash in the link to begin with */
    if(this.canStoreChanges) localStorage.setItem("Settings", settings);
}

/* Gets and sets the version */
StorageManager.prototype.getVersion = function(){
  return localStorage.getItem("Version");
}
StorageManager.prototype.setVersion = function(ver){
  localStorage.setItem("Version", ver);
}

/* gets and sets the data. This is the entire JSON file */
StorageManager.prototype.saveJSON = function(data){
  localStorage.setItem("Data", JSON.stringify(data));
}
StorageManager.prototype.loadJSON = function(){
  return JSON.parse(localStorage.getItem('Data'));
}

StorageManager.prototype.loadSettings = function(){
  var settings = localStorage.getItem("Settings");
  if(settings == null) return false;
  else {
      this.updateView(JSON.parse(settings));
  }
}
