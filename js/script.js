$(function(){
    $(".chosen-select").chosen();
});

$(function(){
    $('.chosen-select').on('change', function(evt, params) {
        getskolevalg(evt, params);
    });
});

//funksjon for å hente ut valgte skoler
function getskolevalg(evt, params){
    var skolevalg = [];
    skolevalg = $('.chosen-select').val()
    //console.log(skolevalg);
    selectSchools(skolevalg);
    }

//IKKE I BRUK. Kan brukes om hver ny params vil sendes istedenfor hele valglisten hver gang
function getskolevalg2(evt, params){
    var skolevalg = [];
    $.each(params, function(){
        skolevalg.push(params);
    });
    selectSchools(skolevalg);
    }
    

    $(function(){
    $(".chosen-select2").chosen();
});

$(function(){
    $('.chosen-select2').on('change', function(evt, params) {
        getinfovalg(evt, params);
    });
});

//funksjon for å hente ut valgte skoler
function getinfovalg(evt, params){
    var valg = [];
    var choices = ["Elev", "SFO", "Lærer"];
    valg = $('.chosen-select2').val()
    var infovalg = choices.filter(function(obj) { if(valg) {return valg.indexOf(obj) == -1; } else {return choices}});
    //console.log(infovalg);
    selectInfo(infovalg);
    }

$(function() {
    $('input[name="daterange"]').daterangepicker({
        "showDropdowns": true,
        "showWeekNumbers": true,
        "showISOWeekNumbers": true,
        "locale": {
            "format": "DD/MM/YYYY",
            "separator": " - ",
            "applyLabel": "Utfør",
            "cancelLabel": "Angre",
            "fromLabel": "Fra",
            "toLabel": "Til",
            "customRangeLabel": "Custom",
            "weekLabel": "U",
            "daysOfWeek": [
                "Sø",
                "Ma",
                "Ti",
                "On",
                "To",
                "Fr",
                "Lø"
            ],
            "monthNames": [
                "Januar",
                "Februar",
                "Mars",
                "April",
                "Mai",
                "Juni",
                "Juli",
                "August",
                "September",
                "Oktober",
                "November",
                "Desember"
            ],
            "firstDay": 1
        },
        "startDate": "01/10/2016",
        "endDate": "01/11/2016",
        "minDate": "01/08/2016"
    }, function(start, end, label) {
        var period ={start:start.format('DD/MM/YYYY'),end:end.format('DD/MM/YYYY')};
        filterDates(period)
        //console.log(period);
        console.log("New date range selected: ' + start.format('DD/MM/YYYY') + ' to ' + end.format('DD/MM/YYYY') + ' (predefined range: ' + label + ')");
    }); 
});