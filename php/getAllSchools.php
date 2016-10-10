<?php
//Written by Aleksander Vevle
//Work in Progress
$mysqli = mysqli_connect("localhost", "root", "", "skoleruter");
mysqli_set_charset($mysqli, "utf8"); //Set charset
if ($mysqli->connect_error) {
	 die("Error, please try again");
}

$laerer            = array();
$elev              = array();
$sfo               = array();
$sqlgetOrderNumber = "select navn from skole s order by navn;";
$result            = $mysqli->query($sqlgetOrderNumber);
if ($result->num_rows != 0) {
    while ($row = $result->fetch_assoc()) {
        $name = $row['navn'];
        if (strpos($name, 'SFO') !== false) { //Er sfo
            $sfo[$name] = array();
        } else {
            $laerer[$name] = array();
            $elev[$name]   = array();
        }
    }
} else {
    echo "Error, please try again";
}

$sqlgetOrderNumber = "select s.navn n, f.dato d, f.ikke_for_ansatte ika,f.grunn g from skole s, fri f where s.ID=f.skoleID  order by n ;";
if ($result = mysqli_query($mysqli, $sqlgetOrderNumber)) {
    // Fetch one and one row
    while ($row = mysqli_fetch_row($result)) {
        $navn        = $row[0];
        $dato        = $row[1];
        $ikkeAnsatte = $row[2];
        $grunn       = $row[3];
        if ($grunn == "") {
            $grunn = "Ukjent";
        }
        if (strpos($navn, 'SFO') !== false) { //Er sfo
            array_push($sfo[$navn], array(
                $dato,
                $grunn
            ));
        } else {
            array_push($elev[$navn], array(
                $dato,
                $grunn
            ));
            if ($ikkeAnsatte == 0) {
                array_push($laerer[$navn], array(
                    $dato,
                    $grunn
                ));
            }
        }
    }
    // Free result set
    mysqli_free_result($result);
}

$keyselev=array_keys($elev);
$keyssfo=array_keys($sfo);
$elevsfosammen=array();

//$copyelev=$elev;
//$copysfo=$sfo;
foreach($keyselev as $e){
		$skolestring=explode(" ",$e);
		$foundSFO=false;
	foreach($keyssfo as $s){
			$sfostring=explode(" ",$s);
			if($skolestring[0]==$sfostring[0]){
				$foundSFO=true;
				$copyelev=array_values($elev[$e]);
				$copysfo=array_values($sfo[$s]);
				$name=$skolestring[0] . ' ' . " Skole og SFO";
				$elevsfosammen[$name]=array();
				while(count($copyelev)>0 && count($copysfo)>0)
				{
					if(strtotime($copyelev[0][0])==strtotime($copysfo[0][0])){
						array_push($elevsfosammen[$name],array($copyelev[0][0], $copyelev[0][1],'FRIDAG'));
						array_shift($copyelev);
						array_shift($copysfo);
					}
					else if(strtotime($copyelev[0][0])<strtotime($copysfo[0][0])){
						array_push($elevsfosammen[$name],array($copyelev[0][0], $copyelev[0][1], 'SFODAG'));
						array_shift($copyelev);
					}
					else{
						array_push($elevsfosammen[$name],array($copysfo[0][0], $copysfo[0][1], 'SKOLEDAG, INGEN SFO'));
						array_shift($copysfo);
					}
				}
			}
	}
	if($foundSFO==false){
			$elevsfosammen[$e]=array();
			foreach($elev[$e] as $day){
				array_push($elevsfosammen[$e],$day);
			}
	}
}

$res        = array(
    /*"elev" => $elev,
    "lærer" => $laerer,
    "sfo" => $sfo,*/
		"elevOgSfo" => $elevsfosammen
);
$jsonstring = json_encode($res,JSON_UNESCAPED_UNICODE);
$mysqli->close();
echo $jsonstring;