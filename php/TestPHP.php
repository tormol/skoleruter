<?php
//Writen by Aleksander Vevle

//The following are tests for the functions in newCreateJSON.php
include 'functionsforgeneratingjson.php';

function TESTdownloadFile(){
  $testurl='https://open.stavanger.kommune.no/dataset/86d3fe44-111e-4d82-be5a-67a9dbfbfcbb/resource/21cfc45a-d2bf-448a-a883-210ee4a96d9a/download/skolerute.csv';
  $wanted=file_get_contents('Testfiles/WantedResultDownload.txt');
  $result = downloadFile($testurl);
  if ($result==$wanted){
    return true;
  }
  return false;
}
function TESTcsvToArray(){
  $result= csvToArray(file_get_contents('Testfiles/TestCsv.txt'));
  $array = array(array('2016-08-01','Auglend skole','Nei','Ja',''),array('2016-08-02','Auglend skole','Nei','Ja',''),array('2016-08-03','Auglend skole','Nei','Ja',''),array('2016-08-04','Auglend skole','Nei','Ja','')
  ,array('2016-08-05','Auglend skole','Nei','Ja',''));
  for($i=0;$i<count($result);$i++){
    if(count(array_diff($result[$i],$array[$i])) !==0){
      return false;
    }
  }
    return true;
}
function TESTmergeArrays(){
  $array1=array(1,2,3);
  $result= mergeArrays(array(array(1,2,3),array(4,5,6)));
  if(count($result)==6){
    return true;
  }
  return false;
}
function TESTcleanArray(){
  $array = array(array('2016-08-01','Auglend skole','Nei','Ja',''),array('2016-08-02','Auglend skole','Nei','Ja',''),array('2016-08-03','Auglend skole','Nei','Ja',''),array('2016-08-04','Auglend skole','Nei','Ja',''),array('2016-08-05','Auglend skole','Nei','Ja',''));
  $result= cleanArray($array);
  $wantedarray=array("Auglend skole" => array(array('2016-08-01','Ukjent','E-F'),array('2016-08-02','Ukjent','E-F'),array('2016-08-03','Ukjent','E-F'),array('2016-08-04','Ukjent','E-F'),array('2016-08-05','Ukjent','E-F')));
  for($i=0;$i<count($result['Auglend skole']);$i++){
    if(count(array_diff($result['Auglend skole'][$i],$wantedarray['Auglend skole'][$i])) !==0){
      return false;
    }
  }
    return true;
}
function TESTarrayToWantedFormat(){
  $result = arrayToWantedFormat(array("Auglend skole" => array(array('2016-08-01','Ukjent','E-F'),array('2016-08-02','Ukjent','E-F'),array('2016-08-03','Ukjent','E-F'),array('2016-08-04','Ukjent','E-F'),array('2016-08-05','Ukjent','E-F'))));
  $wanted = array('Auglend skole' => array(2016 => array(8=>array(1 => array("Ukjent","E-F"),2 => array("Ukjent","E-F"),3 => array("Ukjent","E-F"),4 => array("Ukjent","E-F"),5 => array("Ukjent","E-F")))));
  for($i=1;$i<count($result['Auglend skole'][2016][8]);$i++){
    if(count(array_diff($result['Auglend skole'][2016][8][$i],$wanted['Auglend skole'][2016][8][$i])) !==0){
      return false;
    }
  }
    return true;
}
function TESTarrayToJSON(){
  $result = arrayToJSON(array('Auglend skole' => array(2016 => array(8=>array(1 => array("Ukjent","E-F"),2 => array("Ukjent","E-F"),3 => array("Ukjent","E-F"),4 => array("Ukjent","E-F"),5 => array("Ukjent","E-F"))))));
  $wanted = file_get_contents('Testfiles/WantedResultJSON.txt');
  if ($result==$wanted){
    return true;
  }
  return false;
}
function TESTsaveJSONFile(){
  saveJSONFile('test','Testfiles/','testwritefile.txt');
  if(file_get_contents('Testfiles/testwritefile.txt')=='test'){
    unlink('Testfiles/testwritefile.txt');
    return true;
  }
  unlink('Testfiles/testwritefile.txt');
  return false;
}
// Runs all tests and echos result
function runAllTests(){
  $results = array();
  array_push($results,array(TESTdownloadFile(),"TESTdownloadFile"));
  array_push($results,array(TESTcsvToArray(),"TESTcsvToArray"));
  array_push($results,array(TESTmergeArrays(),"TESTmergeArrays"));
  array_push($results,array(TESTcleanArray(),"TESTcleanArray"));
  array_push($results,array(TESTarrayToWantedFormat(),"TESTarrayToWantedFormat"));
  array_push($results,array(TESTarrayToJSON(),"TESTarrayToJSON"));
  array_push($results,array(TESTsaveJSONFile(),"TESTsaveJSONFile"));

  $numberOfTestsFailed= 0;
  foreach ($results as $element) {
    if($element[0]){
      echo "Test:". $element[1]." passed\n";
    }
    else {
      echo "Test:". $element[1]." failed\n";
      $numberOfTestsFailed++;
    }
  }
if($numberOfTestsFailed==0){
  echo "All tests passed";
}
else{
  echo $numberOfTestsFailed . " tests failed";
}
}
runAllTests();

 ?>
