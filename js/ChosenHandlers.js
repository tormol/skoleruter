/* NB: 'GlobalPrinter' is a global variable created and defined in main.js */

/* Activates on change of date range */
function filterDates(period){
  if(GlobalPrinter == null) return;
  GlobalPrinter.dateRange = period;
  GlobalPrinter.print();
  selectSchools(GlobalPrinter.activeSchools);
}

/* Activates when schools are added or removed */
function selectSchools(ActiveSchools) {
    if(GlobalPrinter == null) return;
    GlobalPrinter.activeSchools = ActiveSchools;
    // if reference list is empty, try to fetch a new one
    var listref = {};
    // fetches references, as index:reference
    var references = $("#q").children();
    // loops through each reference to fetch schoolname of that references
    $.each(references, function(index, objects) {
        // store each reference in listref with schoolname as index
        sN = objects.firstChild.textContent.split(" ")[0]
       // console.log(sN + "dsad")
        listref[sN] = objects;
    });
    //iterate through the reference list
    $.each(listref, function (skoler, refs) {
        // Check if selected school is in display list,
        // if no schools is in display list, show all schools
        if (($.inArray(skoler, GlobalPrinter.activeSchools)) != -1 || GlobalPrinter.activeSchools == null) {
            // shows school if in display list or if list is empty, else hide
            $(refs).show();
        } else $(refs).hide();
    })
    if (GlobalPrinter.types.vanlige === false) {
        GlobalPrinter.unhideNormalDays();
        GlobalPrinter.hideNormalDays();
    }
    // This gets triggered on any changes -> Will change url so it contains linkable data;
   GlobalStorage.updateSettings();
}
