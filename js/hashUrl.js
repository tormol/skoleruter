function doHashURL() {
    hashObject = {}
  
    hashObject[0] = activeSchools;
    hashObject[1] = dateRange;
    hashObject[2] = types;

    window.location.hash = JSON.stringify(hashObject)
}
function existHash() {
    if (window.location.hash) return true;
    return false;
}


function useHashURL() {

    var hashSchools = ["Byfjord Skole og SFO"];

    console.log("TRIGGERED")
    selectSchools(hashSchools);
    test = fetchFirstWord(hashSchools)
    $("#skolevalg").val(hashSchools[0].split(' ')[0])
    $("#skolevalg").trigger("chosen:updated");


}
function fetchFirstWord(someStringArray) {
    // first word required for value...
    $.each(someStringArray, function (index, someString) {
        someStringArray[index] = someString.split(" ")[0]
    })
    
    return someStringArray
}