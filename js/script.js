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
    types.elev = $("#vis_elev").is(":checked");
    types.sfo = $("#vis_sfo").is(":checked");
  //  types.laerer = $("#vis_laerer").is(":checked");
    types.vanlige = $("#vis_vanlige").is(":checked");
    $('#vis_elev').on('change', function() {
        types.elev = !types.elev;
        printT();
    });
    $('#vis_sfo').on('change', function() {
        types.sfo = !types.sfo;
        printT();
    });/*
    $('#vis_laerer').on('change', function() {
        types.laerer = !types.laerer;
        printT();
    });
    */
    $('#vis_vanlige').on('change', function() {
        types.vanlige = !types.vanlige;
        if (types.vanlige === true)
            unhideNormalDays();
        else
            hideNormalDays();
        doHashURL();
    });
});

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
        "startDate": getDate()["start"],
        "endDate": getDate()["end"],
        "minDate": "01/08/2016"
    }, function(start, end, label) {
        var period ={start:start.format('DD/MM/YYYY'),end:end.format('DD/MM/YYYY')};
        filterDates(period)
        //console.log(period);
       // console.log("New date range selected: ' + start.format('DD/MM/YYYY') + ' to ' + end.format('DD/MM/YYYY') + ' (predefined range: ' + label + ')");
    }); 
});
function getDate() {
    if (dateRange != null) {
        
        return dateRange
    }
    return {"start": 01/10/2016, "end": 01/11/2016}
}