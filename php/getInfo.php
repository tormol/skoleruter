<?
//Written by Aleksander Vevle
//Work in Progress
//This is not done or tested yet

$want=$_POST["want"];
//1 Get all schoolnames
//2 Get all schools with all freedays
//3 One school with days off
//4 Get all info about a school
$mysqli = new mysqli("localhost","root","","skoleruter");
if($mysqli->connect_error) {
	die("Error, please try again");
}
if($want==1){
  $sqlgetOrderNumber="select navn from skole s order by navn;";
  $result=$mysqli->query($sqlgetOrderNumber);
  if($result->num_rows !=0){
    while($row=$result->fetch_assoc()){
      $name=$row['navn'];
    }
  }
  else{
    echo "Error, please try again";
}
$mysqli->close();
  }
else if ($want==2){//Ikke ferdig
  $temp=array()
  $laerer=array();
  $elev=array();
  $sfo=array();
  $sqlgetOrderNumber="select navn from skole s order by navn;";
  $result=$mysqli->query($sqlgetOrderNumber);
  if($result->num_rows !=0){
    while($row=$result->fetch_assoc()){
      $name=$row['navn'];
      array_push($temp,$name);
      array_push($laerer,$name);
      array_push($elev,$name);
      array_push($sfo,$name);
    }
  }
  else{
    echo "Error, please try again";
  }

  $sqlgetOrderNumber="select s.navn, f.dato, f.ikke_for_ansatte,f.grunn from skole s natural join fri f sort by s.navn ;";
  //$temp=array();//New array
  $result=$mysqli->query($sqlgetOrderNumber);
  if($result->num_rows !=0){
    while($row=$result->fetch_assoc()){
      $name=$row['navn'];
      for($temp as $n){
        if($n==$name){
          $fri=$row['navn'];
          $ikkeAnsatte=$row['ikke_for_ansatte'];
          $grunn=$row['grunn']
          if(strpos($name, 'sfo') !== false){//Er ikke sfo
            array_push($elev[$name],array($fri,$grunn))
            if($ikkeAnsatte==0){
                array_push($laerer[$name],array($fri,$grunn))
            }
          }
          else{
            array_push($sfo[$name],array($fri,$grunn))
          }

        }
      }
    }
  }
  else{
    //echo "Error: " . $sqlgetOrderNumber . "<br>" . $mysqli->error;
    echo "Error, please try again";
  }
  $res = array($elev,$laerer,$sfo);
  $jsonstring= json_encode($res);
  $mysqli->close();

}
else if ($want==3){//Ikke ferdig
//TODO
$mysqli->close();
}
else if ($want==4){//Ikke ferdig
//TODO
$mysqli->close();
}
