<?php
//Written by Aleksander Vevle
//Work in Progress
//Want:1 now works
$want=$_POST["want"];
//1 Get all schools with all freedays (most used)
//2 One school with days off
//3 Get all info about a school
$mysqli = mysqli_connect("localhost","root","","skoleruter");
mysqli_set_charset($mysqli,"utf8"); //Set charset
if($mysqli->connect_error) {
	die("Error, please try again");
}
if ($want==1){//Get all schools with all freedays (most used)
  $laerer=array();
  $elev=array();
  $sfo=array();
  $sqlgetOrderNumber="select navn from skole s order by navn;";
  $result=$mysqli->query($sqlgetOrderNumber);
  if($result->num_rows !=0){
    while($row=$result->fetch_assoc()){
      $name=utf8_encode($row['navn']);
				if(strpos($name,'SFO') !== false){//Er sfo
					$sfo[$name]=array();
				}
				else{
					$laerer[$name]=array();
		      $elev[$name]=array();
				}
    }
  }
  else{
    echo "Error, please try again";
  }

  $sqlgetOrderNumber="select s.navn n, f.dato d, f.ikke_for_ansatte ika,f.grunn g from skole s, fri f where s.ID=f.skoleID  order by n ;";
	if ($result=mysqli_query($mysqli,$sqlgetOrderNumber))
  {
  // Fetch one and one row
  while ($row=mysqli_fetch_row($result))
    {
			$navn=utf8_encode($row[0]);
			$dato=$row[1];
			$ikkeAnsatte=$row[2];
			$grunn=utf8_encode($row[3]);
			if(strpos($navn,'SFO') !== false){//Er sfo
			array_push($sfo[$navn],array($dato,$grunn));
			}
			else{
				array_push($elev[$navn],array($dato,$grunn));
				if($ikkeAnsatte==0){
						array_push($laerer[$navn],array($dato,$grunn));
				}
			}
    }
  // Free result set
  mysqli_free_result($result);
}

  $res = array("elev"=>$elev,"lærer"=>$laerer,"sfo"=>$sfo);
  $jsonstring= json_encode($res);
  $mysqli->close();
	echo $jsonstring;
}
else if ($want==2){//Ikke ferdig
//TODO
$mysqli->close();
}
else if ($want==3){//Ikke ferdig
//TODO
$mysqli->close();
}
