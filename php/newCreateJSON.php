<?php
//Written by Aleksander Vevle
//This will be the final php after testing

function downloadFile($url){
  return file_get_contents($url);
}
function csvToArray($csvfile){
  return array_map("str_getcsv", explode("\n", $csvfile));
}
function mergeArrays($arrays){
  $newarray = array();
  foreach($arrays as $array){
    foreach($array as $arrayrow){
      array_push($arrayrow);
    }
  }
  return $newarray;
}
// Returns a new array where the rawdata is exchanged for a more structured format with css-classes add
function cleanArray($array){
    $newarray=array();
    foreach($array as $arrayrow){
      $alreadyInArray=false;
      foreach($newarray as $key=>$value){ // Iterate through newarray and see if school already is added
        if($arrayrow['skole']==$key){
          $alreadyInArray=true;
          break;
        }
      }
      if(!$alreadyInArray){ // Add school if necessary
        $newarray[$arrayrow['skole']]= array();
      }
      // The following are logic for adding cssclasses to the array for use in the table in the webinterface
      if($arrayrow['elevdag']=='Nei' || $arrayrow['sfodag']=='Nei'){
        array_push($newarray[$arrayrow['skole']],array($arrayrow['dato'],$arrayrow['kommentar'],'E-S'));//FRIDAG FOR ALLE
      }
      else if ($arrayrow['elevdag']=='Nei' || $arrayrow['sfodag']=='Ja'){
        array_push($newarray[$arrayrow['skole']],array($arrayrow['dato'],$arrayrow['kommentar'],'E-F'));//FRIDAG FOR ELEV
      }
      else{
        array_push($newarray[$arrayrow['skole']],array($arrayrow['dato'],$arrayrow['kommentar'],'F-S'));//FRIDAG FOR SFO
      }

    }
}
// Returns a final array in the correct format wanted for use later in js
function arrayToWantedFormat($array){
  $ArrayInWantedFormat = array();

      foreach ($array as $skolenavn => $data) {
          foreach ($data as $indexed => $singleData) {
              $type = null;
              if (isset($singleData[2])) {
                  $type = $singleData[2];
              }

              $ArrayInWantedFormat[$skolenavn][(int) ((substr($singleData[0], 0, 4)))][(int) (substr($singleData[0], 5, 2))][(int) (substr($singleData[0], 8, 2))] = array(
                  $singleData[1],
                  $type
              );
          }
      }
      return $ArrayInWantedFormat;
}
function arrayToJSON($array){
  return json_encode($array,JSON_UNESCAPED_UNICODE);
}
function saveJSONFile($jsonfile,$wantedfiledir,$filename){
  $fp = fopen($wantedfiledir+$filename, 'w');
  fwrite($fp, $jsonfile);
}

$urlstavanger = 'http://open.stavanger.kommune.no/dataset/86d3fe44-111e-4d82-be5a-67a9dbfbfcbb/resource/32d52130-ce7c-4282-9d37-3c68c7cdba92/download/skolerute-2016-17.csv';
$stavangerarray = csvToArray(downloadFile($urlstavanger));

$urlgjesdal='http://open.stavanger.kommune.no/dataset/c1a060b6-350c-433d-ac78-964ae8b0a9e3/resource/667ed24a-d3a0-4210-9086-f1d336429081/download/skolerute-gjesdal-kommune2.csv';
$gjesdalarray = csvToArray(downloadFile($urlgjesdal));

$mergedarray=mergeArrays(array($stavangerarray,$gjesdalarray));
$cleanedarray=cleanArray($mergedarray);
$jsonfile=arrayToJSON(arrayToWantedFormat($cleanedarray));
saveJSONFile($jsonfile,'../data/','newdata.json');
 ?>
