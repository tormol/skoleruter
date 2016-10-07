<?php
//Written by Aleksander Vevle
//Work in Progress
//Want:1 now works
//Want:2 now works
//Want:3 now works



$want  = $_POST["want"];
$skole = "";
if ($want != 1 && $want !=4) {
	 $skole = $_POST["school"];
}
//1 Get all schools with all freedays (most used)
//2 One school with days off
//3 Get all info about a school
//4 Get all school names
$mysqli = mysqli_connect("localhost", "root", "", "skoleruter");
mysqli_set_charset($mysqli, "utf8"); //Set charset
if ($mysqli->connect_error) {
	 die("Error, please try again");
}
if ($want == 1) { //Get all schools with all freedays (most used)
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

	 $res        = array(
			 "elev" => $elev,
			 "lærer" => $laerer,
			 "sfo" => $sfo
	 );

    // TODO YNGVES OBJECT OVERSETTER... yes
    $object = array();

    foreach ($res as $person => $skoler) {
        foreach ($skoler as $skolenavn => $data) {
            foreach ($data as $test => $singleData) {
                $object[$person][$skolenavn][(int)((substr($singleData[0], 0, 4)))][(int)(substr($singleData[0], 5, 2))][(int)(substr($singleData[0], 8, 2))] =  $singleData[1];

            }
        }
    }

	 $jsonstring = json_encode($object,JSON_UNESCAPED_UNICODE);
	 $mysqli->close();
	 echo $jsonstring;
} else if ($want == 2) {

	 if (strpos($skole, 'SFO') !== false) { //Er sfo
			 $sql         = "select s.navn n, f.dato d,f.grunn g from skole s, fri f where s.navn=\"$skole\" and s.ID=f.skoleID  order by n ;";
			 $sfo         = array();
			 $sfo[$skole] = array();
			 if ($result = mysqli_query($mysqli, $sql)) {
					 // Fetch one and one row
					 while ($row = mysqli_fetch_row($result)) {
							 $navn  = $row[0];
							 $dato  = $row[1];
							 $grunn = $row[2];
							 if ($grunn == "") {
									 $grunn = "Ukjent";
							 }
							 array_push($sfo[$navn], array(
									 $dato,
									 $grunn
							 ));

					 }
					 // Free result set
					 mysqli_free_result($result);
					 $res        = array(
							 "sfo" => $sfo
					 );
					 $jsonstring = json_encode($res,JSON_UNESCAPED_UNICODE);
					 $mysqli->close();
					 echo $jsonstring;
			 } else {
					 echo "error";
			 }
	 } else {
			 $laerer         = array();
			 $elev           = array();
			 $laerer[$skole] = array();
			 $elev[$skole]   = array();
			 $sql            = "select s.navn n, f.dato d, f.ikke_for_ansatte ika,f.grunn g from skole s, fri f where s.navn=\"$skole\" and s.ID=f.skoleID  order by n ;";
			 if ($result = mysqli_query($mysqli, $sql)) {
					 // Fetch one and one row
					 while ($row = mysqli_fetch_row($result)) {
							 $navn        = $row[0];
							 $dato        = $row[1];
							 $ikkeAnsatte = $row[2];
							 $grunn       = $row[3];
							 if ($grunn == "") {
									 $grunn = "Ukjent";
							 }
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
					 // Free result set
					 mysqli_free_result($result);
					 $res        = array(
							 "elev" => $elev,
							 "lærer" => $laerer
					 );
					 $jsonstring = json_encode($res,JSON_UNESCAPED_UNICODE);
					 $mysqli->close();
					 echo $jsonstring;
			 } else {
					 echo "error";
			 }
	 }

} else if ($want == 3) {
	 $adresse  = "";
	 $nettside = "";
	 $telefon  = "";
	 $posisjon = "";

	 $sql = "select adresse, nettside, telefon,posisjon from skole where navn=\"$skole\";";

	 if ($result = mysqli_query($mysqli, $sql)) {
			 // Fetch one and one row
			 while ($row = mysqli_fetch_row($result)) {
					 $adresse  = $row[0];
					 $nettside = $row[1];
					 $telefon  = $row[2];
					 $posisjon = $row[3];
			 }

			 // Free result set
			 mysqli_free_result($result);
			 $mysqli->close();
	 }
	 $result     = array(
			 "navn" => $skole,
			 "adresse" => $adresse,
			 "nettside" => $nettside,
			 "telefon" => $telefon,
			 "posisjon" => $posisjon
	 );
	 $jsonstring = json_encode($result,JSON_UNESCAPED_UNICODE);
	 echo $jsonstring;

}
else if($want==4){//All school names
	$sql="select navn from skole";
	$skoler=array();
	if ($result = mysqli_query($mysqli, $sql)) {
		while ($row = mysqli_fetch_row($result)) {
			array_push($skoler,$row[0]);
		}
	}
	$jsonstring = json_encode($skoler,JSON_UNESCAPED_UNICODE);
	echo $jsonstring;
}
