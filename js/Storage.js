/* Contains all the storage related functions */
var canStoreChanges = true;

function getVersion(){
  return localStorage.getItem("Version");
}

function setVersion(ver){
  localStorage.setItem("Version", ver);
}

function saveJSON(data){
  localStorage.setItem("Data", JSON.stringify(data));
}

function loadJSON(){
  return JSON.parse(localStorage.getItem('Data'));
}

function storeSettings(settings){
  localStorage.setItem("Settings", settings);
}

/* Loads the stored settings off the storage and update them with the
   function defined in 'hashUrl' */
function loadSettings(){
  var settings = localStorage.getItem("Settings");
  if(settings == null) return false;
  else {
      updateSettings(JSON.parse(settings));
  }
}

/* If settings are exsist, they are compared to the hash to see if they
   are equal. This solves the problem where a user refresh the site, and
   their own hash would prevent them from editing. */
function settingsIsHash(){
  var settings = localStorage.getItem("Settings");
  if(settings == null) return false;
  else {
    return (settings == getHashString());
  }
}

function postLoadSettings(){
  var settings = localStorage.getItem("Settings");
  if(settings == null) return false;
  else {
      postUpdateSettings(JSON.parse(settings));
  }
}
