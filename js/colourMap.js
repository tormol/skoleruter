/**
 * Created by Linds on 23/10/2016.
 */
var colourMap = {
    /* The map is an Object, Keys-> .css filenames, whilst value -> background colour for that filename
     * filenames are logically set up, think TRUE/FALSE
     *  E-L-S -> means show everyone, E-F-S -> show everyone, except teacher .. ETC:
     */
    "F-F-F": {colour:"#fff8e7", text:"vanlig"},
    "F-L-F": {colour:"#fff8e7", text:"vanlig"},// Gjesdal
    "F-F-S": {colour:"#eeaaaa", text:"ikke SFO"},
    "F-L-S": {colour:"#eeaaaa", text:"ikke SFO"},// Gjesdal
    "E-F-S": {colour:"#777780", text:"plan.dag u/SFO"},
    "E-F-F": {colour:"#99dd88", text:"plan.dag m/SFO"},
    "E-L-F": {colour:"#82a282", text:"kun SFO"},
    "E-L-S": {colour:"#727270", text:"alle fri"}
}
function addColours() {
    $.each(colourMap, function(type, display) {
        // Screen readers don't see colours, so we need to have text for those.
        // We use text-ident to hide the text for others.
        // Since there is no link or input this should work well. 
        createClass("*." + type, "background-color: " + display.colour + " !important;");
        $("."+type).text(display.text);
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


