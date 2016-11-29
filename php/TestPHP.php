<?php
//Writen by Aleksander Vevle

//The following are tests for the functions in newCreateJSON.php
include 'newCreateJSON.php';

function TESTdownloadFile(){
  $testurl='http://open.stavanger.kommune.no/dataset/86d3fe44-111e-4d82-be5a-67a9dbfbfcbb/resource/32d52130-ce7c-4282-9d37-3c68c7cdba92/download/skolerute-2016-17.csv';
  $wanted=file_get_contents('Testfiles/WantedResultDownload.txt');
  $result = downloadFile($testurl);
  if ($result==$wanted){
    return true;
  }
  return false;
}
function TESTcsvToArray(){
  $result= csvToArray(file_get_contents('Testfiles/WantedResultDownload.txt'));
  $wanted = file_get_contents('Testfiles/WantedResultArray.txt');
  if (print_r($result,true)==$wanted){
    return true;
  }
  return false;
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
  $result= cleanArray(file_get_contents('Testfiles/MergedArrays.txt'));
  $wanted = file_get_contents('Testfiles/WantedResultCleaned.txt');
  if ($result==$wanted){
    return true;
  }
  return false;
}
function TESTarrayToWantedFormat(){
  $result = ArrayToWantedFormat(file_get_contents('TestFiles/WantedResultCleaned.txt'));
  $wanted = file_get_contents('Testfiles/WantedResultCorrectFormat.txt');
  if ($result==$wanted){
    return true;
  }
  return false;
}
function TESTarrayToJSON(){
  $result = arrayToJSON(file_get_contents('Testfiles/WantedResultCorrectFormat.txt'));
  $wanted = file_get_contents('../data/newdata.json');
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
  array_push($results,TESTdownloadFile());
  array_push($results,TESTcsvToArray());
  array_push($results,TESTmergeArrays());
  //array_push($results,TESTcleanArray());
  //array_push($results,TESTarrayToWantedFormat());
  //array_push($results,TESTarrayToJSON());
  array_push($results,TESTsaveJSONFile());

  foreach ($results as $element) {
    if($element){
      echo "Test passed\n";
    }
    else {
      echo "Test failed\n";
    }
  }
  //echo '';
}
runAllTests();

 ?>
