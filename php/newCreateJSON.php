<?php
header('Content-type: text/plain; charset=UTF-8');
//Written by Aleksander Vevle
//This will be the final php after testing

// Global values for fieldpositions in both csvfiles after laererfield is removed
$datefield    = 0;
$namefield    = 1;
$studentfield = 2;
$sfofield     = 3;
$commentfield = 4;

include 'functionsforgeneratingjson.php';

$urlstavanger   = 'https://open.stavanger.kommune.no/dataset/86d3fe44-111e-4d82-be5a-67a9dbfbfcbb/resource/21cfc45a-d2bf-448a-a883-210ee4a96d9a/download/skolerute.csv';
$stavangerstring = downloadFile($urlstavanger);
$stavangerarray = csvToArray($stavangerstring);

$urlgjesdal    = 'http://open.stavanger.kommune.no/dataset/c1a060b6-350c-433d-ac78-964ae8b0a9e3/resource/667ed24a-d3a0-4210-9086-f1d336429081/download/skolerute-gjesdal-kommune2.csv';
$gjesdalstring = downloadFile($urlgjesdal);
$gjesdalarray  = csvToArray($gjesdalstring);

$mergedarray       = mergeArrays(array(
   $stavangerarray,
   $gjesdalarray
));
$cleanedarray      = cleanArray($mergedarray);
$arraywantedformat = arrayToWantedFormat($cleanedarray);
$jsonfile          = arrayToJSON($arraywantedformat);
saveJSONFile($jsonfile, '../data/', 'newdata.json');
echo "JSON file saved in data folder as newdata.json";
?>
