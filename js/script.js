$(function(){
    $(".chosen-select").chosen();
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
        "startDate": "01/10/2016",
        "endDate": "01/11/2016",
        "minDate": "01/08/2016"
    }, function(start, end, label) {
    console.log("New date range selected: ' + start.format('YYYY-MM-DD') + ' to ' + end.format('YYYY-MM-DD') + ' (predefined range: ' + label + ')");
    }); 
});