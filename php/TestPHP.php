<?php
//Writen by Aleksander Vevle

//The following are tests for the functions in newCreateJSON.php
include 'newCreateJSON.php';

function TESTdownloadFile(){
  $testurl='';
  $wanted='';
  $result = downloadFile($testurl);
  if ($result==$wanted){
    return true;
  }
  return false;
}
function TESTcsvToArray(){
  csvToArray();
}
function TESTmergeArrays(){
  mergeArrays();
}
function TESTcleanArrays(){
  cleanArrays();
}
function TESTarrayToWantedFormat(){
  arrayToWantedFormat();
}
function TESTarrayToJSON(){
  arrayToJSON();
}
function TESTsaveJSONFile(){
  saveJSONFile();
}
// Runs all tests and echos result
function runAllTests(){
  TESTdownloadFile();
  TESTcsvToArray();
  TESTmergeArrays();
  TESTcleanArrays();
  TESTarrayToWantedFormat();
  TESTarrayToJSON();
  TESTsaveJSONFile();

  echo '';
}


 ?>
