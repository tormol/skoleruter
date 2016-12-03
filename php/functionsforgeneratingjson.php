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

// Download file and convert to UTF-8 if necessary
function file_get_contents_utf8($fn)
{
   $content = file_get_contents($fn);
   return mb_convert_encoding($content, 'UTF-8', mb_detect_encoding($content, 'UTF-8, ISO-8859-1', true));
}
function downloadFile($url)
{
   return file_get_contents_utf8($url);
}
// Combines arrays, removes the field laererdag and adds numbers as keys to remove the possibility of differences in syntax in the csvfiles
// This function assumes that the order of fields in different csvfiles is the same
function array_combine2($arr1, $arr2)
{
   $keys   = array();
   $values = array();
   $i      = 0;
   foreach ($arr1 as $key => $value) {
       if ($value == 'laererdag')
           continue;
       $keys[$i] = $i;
       $i++;
   }
   if (count($arr2) == 6) { // If csvfile with laererfield
       $i      = 0;
       $offset = 0;
       foreach ($arr2 as $key => $value) {
           if ($i == 3) { // If larerfield
               $i++;
               $offset = -1;
               continue;
           }
           $values[$i + $offset] = $value;
           $i++;
       }
   } else {
       $i = 0;
       foreach ($arr2 as $key => $value) {
           $values[$i] = $value;
           $i++;
       }
   }
   $count = min(count($keys), count($values));
   return array_combine(array_slice($keys, 0, $count), array_slice($values, 0, $count));
}
function csvToArray($csvfile)
{
   $csv = array_map("str_getcsv", explode("\n", $csvfile));
   array_walk($csv, function(&$a) use ($csv)
   {
       $a = array_combine2($csv[0], $a);
   });
   array_shift($csv);
   return $csv; // Remove header and return
}
function mergeArrays($arrays)
{
   $newarray = array();
   foreach ($arrays as $array) {
       foreach ($array as $arrayrow) {
           array_push($newarray, $arrayrow);
       }
   }
   return $newarray;
}
// Takes the merged array as parameter and links fields belonging to the same school together, adds CSS-classes to be used later and removes SFOinfo about schools that dont have
function cleanArray($array)
{
   global $datefield, $namefield, $studentfield, $sfofield, $commentfield;
   $newarray = array();
   foreach ($array as $arrayrow) {
       if (count($arrayrow) < 3)
           continue;
       $alreadyInArray = false;
       foreach ($newarray as $key => $value) { // Iterate through newarray and see if school already is added
           if (ucfirst($arrayrow[$namefield]) == ucfirst($key)) {
               $alreadyInArray = true;
               break;
           }
       }
       if (!$alreadyInArray) { // Add school if necessary
           $name                     = $arrayrow[$namefield];
           $newarray[ucfirst($name)] = array();
       }
       $grunn = "";
       if (count($arrayrow) == 5) {
           $reason = $arrayrow[$commentfield];
           $reason = rtrim($reason);
           if ($reason == "") {
               $reason = "Ukjent";
           }
       }
       // The following are logic for adding cssclasses to the array for use in the table in the webinterface
       if ($arrayrow[$studentfield] == 'Nei' && $arrayrow[$sfofield] == 'Nei') {
           array_push($newarray[ucfirst($arrayrow[$namefield])], array(
               $arrayrow[$datefield],
               $reason,
               'E-S'
           )); //FRIDAG FOR ALLE
       } else if ($arrayrow[$studentfield] == 'Nei' && $arrayrow[$sfofield] == 'Ja') {
           array_push($newarray[ucfirst($arrayrow[$namefield])], array(
               $arrayrow[$datefield],
               $reason,
               'E-F'
           )); //FRIDAG FOR ELEV
       } else if ($arrayrow[$studentfield] == 'Ja' && $arrayrow[$sfofield] == 'Nei') {
           array_push($newarray[ucfirst($arrayrow[$namefield])], array(
               $arrayrow[$datefield],
               $reason,
               'F-S'
           )); //FRIDAG FOR SFO
       }

   }
   $newarray = removeSFOInfo($newarray);
   return $newarray;
}
// Changes the info about schools that dont have sfo to not show wrong info
function removeSFOInfo($arraywithsfo)
{
   foreach ($arraywithsfo as $key => $value) {
       $sfo = false;
       foreach ($value as $day) {
           if (substr($day[2], 2, 1) == 'F') {
               $sfo = true;
               break;
           }
       }
       if (!$sfo) {
           for ($i = 0; $i < count($value); $i++) {
               if (substr($arraywithsfo[$key][$i][2], 0, 1) == "F" && substr($arraywithsfo[$key][$i][2], 2, 1) == "S") {
                   unset($arraywithsfo[$key][$i]);
               } else if ($arraywithsfo[$key][$i][2] == "E-F") {
                   $arraywithsfo[$key][$i][2] = substr($arraywithsfo[$key][$i][2], 0, 2) . 'S';
               }
           }
       }
   }
   return $arraywithsfo;
}
// Returns a final array in the correct format wanted for use later in js
function arrayToWantedFormat($array)
{
   $ArrayInWantedFormat = array();

   foreach ($array as $skolenavn => $data) {
       foreach ($data as $indexed => $singleData) {
           $type = null;
           if (isset($singleData[2])) {
               $type = $singleData[2];
           }
           $date                                                                                                                                                         = $singleData[0];
           $properformatdate                                                                                                                                             = date("Y-m-d", strtotime($date));
           $ArrayInWantedFormat[$skolenavn][(int) ((substr($properformatdate, 0, 4)))][(int) (substr($properformatdate, 5, 2))][(int) (substr($properformatdate, 8, 2))] = array(
               $singleData[1],
               $type
           );
       }
   }
   return $ArrayInWantedFormat;
}
function arrayToJSON($array)
{
   return json_encode($array, JSON_UNESCAPED_UNICODE);
}
function saveJSONFile($jsonfile, $wantedfiledir, $filename)
{
   $fp = fopen($wantedfiledir . $filename, 'w');
   fwrite($fp, $jsonfile);
   fclose($fp);
   updateVersion();
}
function updateVersion(){
  $prevver = intval(file_get_contents("../data/dataversion.txt"));
  $newver = $prevver+1;
  file_put_contents("../data/dataversion.txt",$newver);
}

?>
