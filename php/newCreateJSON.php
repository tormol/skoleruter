<?php header('Content-type: text/plain; charset=UTF-8');
//Written by Aleksander Vevle
//This will be the final php after testing

function file_get_contents_utf8($fn) {
     $content = file_get_contents($fn);
      return mb_convert_encoding($content, 'UTF-8',
          mb_detect_encoding($content, 'UTF-8, ISO-8859-1', true));
}
function downloadFile($url){
  return file_get_contents_utf8($url);
}

function array_combine2($arr1, $arr2) {
    $keys=array();
    $values=array();
    $i=0;
    foreach($arr1 as $key=>$value){
      if($value=='laererdag')continue;
      $keys[$i]=$i;
      $i++;
    }
    if(count($arr2)==6){
      $i=0;
      $offset=0;
    foreach ($arr2 as $key => $value) {
      if($i==3){
        $i++;
        $offset=-1;
        continue;
      }
      $values[$i+$offset]=$value;
      $i++;
    }
    }
    else {
    $i=0;
  foreach ($arr2 as $key => $value) {
    $values[$i]=$value;
    $i++;
  }
}
    $count = min(count($keys), count($values));
    return array_combine(array_slice($keys, 0, $count), array_slice($values, 0, $count));
}


function csvToArray($csvfile){
  $csv= array_map("str_getcsv", explode("\n", $csvfile));
  array_walk($csv, function(&$a) use ($csv) {
        $a = array_combine2($csv[0], $a);
  });
  array_shift($csv); # remove column header
  //$csv=array_change_key_case($csv, CASE_LOWER);
  return $csv;
}
function mergeArrays($arrays){
  $newarray = array();
  foreach($arrays as $array){
    foreach($array as $arrayrow){
      array_push($newarray,$arrayrow);
    }
  }
  return $newarray;
}

function cleanArray($array){
    $newarray=array();
    foreach($array as $arrayrow){
      if(count($arrayrow)<3)continue;
      $alreadyInArray=false;
      foreach($newarray as $key=>$value){ // Iterate through newarray and see if school already is added
        if(ucfirst($arrayrow[1])==ucfirst($key)){
          $alreadyInArray=true;
          break;
        }
      }
      if(!$alreadyInArray){ // Add school if necessary
        $name = $arrayrow[1];
        $newarray[ucfirst($arrayrow[1])]= array();
      }
      $grunn="";
      if(count($arrayrow)==5){
      $grunn=$arrayrow[4];
      if($grunn==""){
        $grunn="Ukjent";
      }
      }
      // The following are logic for adding cssclasses to the array for use in the table in the webinterface
      if($arrayrow[2]=='Nei' && $arrayrow[3]=='Nei'){
        array_push($newarray[ucfirst($arrayrow[1])],array($arrayrow[0],$grunn,'E-S'));//FRIDAG FOR ALLE
      }
      else if ($arrayrow[2]=='Nei' && $arrayrow[3]=='Ja'){
        array_push($newarray[ucfirst($arrayrow[1])],array($arrayrow[0],$grunn,'E-F'));//FRIDAG FOR ELEV
      }
      else if ($arrayrow[2]=='Ja' && $arrayrow[3]=='Nei'){
        array_push($newarray[ucfirst($arrayrow[1])],array($arrayrow[0],$grunn,'F-S'));//FRIDAG FOR SFO
      }

    }
    //Loop through new array to remove sfoinfo about schools with no sfoinfo
    foreach ($newarray as $key => $value) {
        $sfo = false;
        foreach ($value as $day) {
          if(substr($day[2],2,1)=='F'){
            $sfo=true;
            break;
          }
        }
        if(!$sfo){
          for($i=0;$i<count($value);$i++){
            if(substr($newarray[$key][$i][2],0,1)=="F" && substr($newarray[$key][$i][2],2,1)=="S"){
              unset($newarray[$key][$i]);
            }
            else if($newarray[$key][$i][2]=="E-F"){
              $newarray[$key][$i][2]=substr($newarray[$key][$i][2],0,2) . 'S';
            }
          }
        }
    }

    return $newarray;
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
              $date = $singleData[0];
              $properformatdate=date("Y-m-d",strtotime($date));
              $ArrayInWantedFormat[$skolenavn][(int) ((substr($properformatdate, 0, 4)))][(int) (substr($properformatdate, 5, 2))][(int) (substr($properformatdate, 8, 2))] = array(
                  $singleData[1],
                  $type
              );
          }
      }
      //print_r($ArrayInWantedFormat);
      return $ArrayInWantedFormat;
}
function arrayToJSON($array){
  return json_encode($array,JSON_UNESCAPED_UNICODE);
}
function saveJSONFile($jsonfile,$wantedfiledir,$filename){
  $fp = fopen($wantedfiledir . $filename, 'w');
  fwrite($fp, $jsonfile);
  fclose($fp);
}

$urlstavanger = 'http://open.stavanger.kommune.no/dataset/86d3fe44-111e-4d82-be5a-67a9dbfbfcbb/resource/32d52130-ce7c-4282-9d37-3c68c7cdba92/download/skolerute-2016-17.csv';
$stavangerarray = csvToArray(downloadFile($urlstavanger));

$urlgjesdal='http://open.stavanger.kommune.no/dataset/c1a060b6-350c-433d-ac78-964ae8b0a9e3/resource/667ed24a-d3a0-4210-9086-f1d336429081/download/skolerute-gjesdal-kommune2.csv';
$gjesdalstring=downloadFile($urlgjesdal);
$gjesdalarray = csvToArray($gjesdalstring);

$mergedarray=mergeArrays(array($stavangerarray,$gjesdalarray));
//print_r($mergedarray);
$cleanedarray=cleanArray($mergedarray);
//print_r($cleanedarray);
$arraywantedformat=arrayToWantedFormat($cleanedarray);
//print_r($arraywantedformat);
$jsonfile=arrayToJSON($arraywantedformat);
print_r($jsonfile);
saveJSONFile($jsonfile,'../data/','newdata.json');
 ?>
