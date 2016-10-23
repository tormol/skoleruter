/**
 * Created by Linds on 23/10/2016.
 */
var colourMap = {
    /* The map is an Object, Keys-> .css filenames, whilst value -> background colour for that filename
     * filenames are logically set up, think TRUE/FALSE
     *  E-L-S -> means show everyone, E-F-S -> show everyone, except teacher .. ETC:
     */
    "F-F-F" : "#fff8e7",
    "F-F-S" : "#ff0010",
    "F-L-F" : "#1eff00",
    "F-L-S" : "#ffef00",
    "E-F-F" : "#0700ff",
    "E-F-S" : "#f900ff",
    "E-L-F" : "#00fcff",
    "E-L-S" : "#000000"
}
function addColours() {
    $.each(colourMap, function(cssName, colour) {
        createClass("#q *." + cssName, "background-color:" + colour);
    })
}

function createClass(name,rules){
    var style = document.createElement('style');
    style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(style);
    if(!(style.sheet||{}).insertRule)
        (style.styleSheet || style.sheet).addRule(name, rules);
    else
        style.sheet.insertRule(name+"{"+rules+"}",0);
}


