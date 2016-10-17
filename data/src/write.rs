use std::io::{stderr,Write};
use std::{u16,str};
use common::*;

pub type FormatWriter = fn(&mut Write, Vec<Skole>, Date);
pub fn as_format(typ: &str) -> FormatWriter {match typ {
	"sql_old" => sql_old,
	"json_1"  => json_1,
	_ => abort!("Ukjent ut-format: {:?}", typ)
}}

macro_rules! w {($dest:expr, $format:expr $(,$arg:expr)*) => {
	if let Err(e) = write!($dest, $format $(,$arg)*) {
		abort!("Feil ved skriving: {:?}", e);
	}
}}

fn opt_bool(v: Option<bool>) -> &'static str {match v {
	Some(true)  => "true",
	Some(false) => "false",
	None        => "null",
}}


fn json_1(dst: &mut Write, skoler: Vec<Skole>, sist_oppdatert: Date) {
	w!(dst, "[\n");
	w!(dst, "\"sist_oppdatert\": \"{}\"\n", sist_oppdatert);
	w!(dst, "\"verjon\": [1,0]\n");
	w!(dst, "\"skoler\": {{\n");
	foreach_mark_last(skoler, |siste, skole| {
		w!(dst, "\t{:?}: {{\n", skole.navn);
		match skole.om.and_then(|om| om.telefon ) {
			Some(tlf) => w!(dst, "\t\t\"tlf\": = {:?},\n", str::from_utf8(&tlf[..]).unwrap()),
			None      => w!(dst, "\t\t\"tlf\": = null,\n"),
		}
		if let Some(om) = skole.om {
			w!(dst, "\t\t\"adresse\" : {:?},\n", om.adresse);
			w!(dst, "\t\t\"nettside\": {:?},\n", om.nettside);
			w!(dst, "\t\t\"posisjon\": [\"{}\",\"{}\"],\n", om.posisjon[0], om.posisjon[1]);
		} else {
			w!(dst, "\t\t\"adresse\" : null,\n");
			w!(dst, "\t\t\"nettside\": null,\n");
			w!(dst, "\t\t\"posisjon\": null,\n");
		}
		let rute = skole.rute.unwrap();
		w!(dst, "\t\t\"gjelder\": [\"{}\",\"{}\"],\n", rute.gjelder_fra, rute.gjelder_til);
		w!(dst, "\t\t\"har_sfo\": {},\n", rute.har_sfo);
		w!(dst, "\t\t\"har_lærer\": {},\n", rute.har_laerer);
		w!(dst, "\t\t\"fri\": {{\n");
		foreach_mark_last(rute.fri, |siste,fri| {
			w!(dst, "\t\t\t\"{}\": {{", fri.date);
			w!(dst, "\"elever\": {:5},  ", fri.pupils);
			w!(dst, "\"lærere\": {:5},  ", opt_bool(fri.teachers));
			w!(dst, "\"sfo\": {:5},  ", opt_bool(fri.afterschool));
			w!(dst, "\"kommentar\": {:?}}}{}\n", fri.comment, if siste {","} else {""} );
		});
		w!(dst, "\t}}}}{}\n", if siste {","} else {""} );
	});
	w!(dst, "}}}}\n");
}


fn sql_old(dst: &mut Write, skoler: Vec<Skole>, sist_oppdatert: Date) {
	abort_if!(skoler.len() > u16::MAX as usize,
	          "Database-skjemaet må oppdateres: for mange skoler: {}", skoler.len() );
	#[allow(non_snake_case)]
	struct FriTbl<'a> {
		skoleID: u16,
		dato: Date,
		ikke_for_ansatte: i8,
		grunn: &'a str,
	}
	let mut fri = Vec::new();
	for (i,skole) in skoler.iter().enumerate() {
		for dag in &skole.rute.as_ref().unwrap().fri {
			abort_if!(dag.comment.len() > 255, "For lang kommentar: {:?} for {} ved {}",
			                                   dag.comment, dag.date, &skole.navn);
			fri.push(FriTbl{
				skoleID: i as u16 + 1,
				dato: dag.date,
				ikke_for_ansatte: if dag.teachers == Some(false) {1} else {0},
				grunn: dag.comment,
			});
		}
	}


	w!(dst, "use skoleruter;\n");
	w!(dst, "\n");
	w!(dst, "insert into skole (ID,sfo,navn,data_gyldig_til,sist_oppdatert,telefon,adresse,nettside,posisjon) values\n");
	for (i,skole) in skoler.iter().enumerate() {
		let sfo = "null";
		let gjelder_til = skole.rute.as_ref().unwrap().gjelder_til;
		let tlf = match skole.om.and_then(|k| k.telefon ) {
			Some(tlf) => format!("'{}'", str::from_utf8(&tlf[..]).unwrap()),
			None => "null".to_string(),
		};
		let adresse = skole.om.map(|k| k.adresse ).unwrap_or("");
		let url = skole.om.map(|k| k.nettside ).unwrap_or("");
		let pos = skole.om.map(|k| k.posisjon ).unwrap_or(["0","0"]);

		abort_if!(skole.navn.len() > 255, "For langt navn: {:?}", skole.navn);
		abort_if!(adresse.len() > 1000, "For lang adresse: {:?}", adresse);
		abort_if!(url.len() > 1000, "For lang URL: {:?}", url);
		let sep = if i+1 == skoler.len() {';'} else {','};
		w!(dst, "\t({},{},'{}','{:?}','{:?}',{},'{}','{}',POINT({},{})){}\n",
		        i+1, sfo, skole.navn, gjelder_til, sist_oppdatert,
		        tlf, adresse, url, pos[0], pos[1], sep);
	}

	w!(dst, "\n");
	w!(dst, "insert into fri (skoleID,dato,ikke_for_ansatte,grunn) values\n");
	for (i,dag) in fri.iter().enumerate() {
		let sep = if i+1 == fri.len() {';'} else {','};
		w!(dst, "\t({},'{:?}',{},'{}'){}\n",
		        dag.skoleID, dag.dato, dag.ikke_for_ansatte, dag.grunn, sep);
	}
}
