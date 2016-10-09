<?php
$mysqli = mysqli_connect("localhost", "root", "", "skoleruter");
mysqli_set_charset($mysqli, "utf8"); //Set charset
if ($mysqli->connect_error) {
	 die("Error, please try again");
}
$sql="select navn from skole";
$skoler=array();
if ($result = mysqli_query($mysqli, $sql)) {
  while ($row = mysqli_fetch_row($result)) {
    array_push($skoler,$row[0]);
  }
}
$jsonstring = json_encode($skoler,JSON_UNESCAPED_UNICODE);
echo $jsonstring;
