$(function(){
  addColours();
  aquireJSON();

});

/* Dersom man ønsker å endre på hva som skjer etter at dataene er lastet
   inn, plasseres det her */
function afterGet(data){
    prints(data);
    if (existHash()) {
        useHashURL()
    }
}

/* Denne funksjonen bruker localStorage til å lagre og hente JSON filen
   som inneholder all den dataen som vises i skoleruten. Derretter kaller
   den afterGet(). Grunnen til at den må kalle en anne funkson etterpå, og
   ikke returnere en verdi, er fordi $.get() og $.getJSON() er asynkrone
   funksjoner. Den vil altså ikke returnere noe som helst før JSON filen
   er ferdig lest. Siden dette i noen tilfeller tar mer enn 1 gjennomkjøring,
   kan det hende at den returnerer NULL */
function aquireJSON(){
  var JsonPath = "php/yngveformatcssklasser.json";

  // Henter versjons-nummeret til JSON filen
  $.get('php/JsonVersjon.txt', function(ver) {
    /* Dersom nettleseren ikke støtter localStorage, er det ikke nødvendig å sjekke
       om variabler er lagret */
      if (typeof(Storage) == "undefined"){
        $.getJSON(JsonPath, function (data) { afterGet(data); });
        return;
      }
      /* Dersom versjons-nummeret ikke er satt, eller det har blitt endret siden forrige gang,
         hentes json filen på nytt og versjon og json-data lagres */
      if(localStorage.getItem("Version") == null || localStorage.getItem("Version") != ver){
          console.log("New version");
        $.getJSON(JsonPath, function (data) {
          localStorage.setItem("Version", ver);
          localStorage.setItem("Data", JSON.stringify(data));
          afterGet(data);
        });
      }
      /* Dersom versjons-nummeret er rett, og dataen ikke har blitt slettet siden forrige
         gang, så hentes JSON filen i fra lokal disk, i stedenfor å hentes fra server */
      else if (localStorage.getItem("Data") != null) {
        console.log("Same version: " + ver);
        var data = JSON.parse(localStorage.getItem('Data'));
        afterGet(data);
      }
  }, 'text');
}
