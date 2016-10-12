use std::io::{stderr,Write};
use std::cmp::Ordering;
use std::{u16,str};
use common::*;


pub fn to_sql(mut skoler: Vec<Skole>) {
	abort_if!(skoler.len() > u16::MAX as usize,
	          "Database-skjemaet må oppdateres: for mange skoler: {}", skoler.len() );
	// IDs to SFOs must already exists
	skoler.sort_by_key(|s| match s.sfo {
		SFO::er_for(_) => Ordering::Less,
		SFO::har_ikke  => Ordering::Equal,
		SFO::har(_)    => Ordering::Greater,
		SFO::vet_ikke  => Ordering::Less,
	});
	#[allow(non_snake_case)]
	struct FriTbl<'a> {
		skoleID: u16,
		dato: Date,
		ikke_for_ansatte: i8,
		grunn: &'a str,
	}
	let mut fri = Vec::new();
	for (i,skole) in skoler.iter().enumerate() {
		for dag in &skole.fri {
			abort_if!(dag.kommentar.len() > 255, "For lang kommentar: {:?} for {} ved {}",
			                                     dag.kommentar, dag.date, &skole.navn);
			fri.push(FriTbl{
				skoleID: i as u16 + 1,
				dato: dag.date,
				ikke_for_ansatte: if dag.for_ansatte {0} else {1},
				grunn: dag.kommentar,
			});
		}
	}


	println!("use skoleruter;");
	println!("");
	println!("insert into skole (ID,sfo,navn,data_gyldig_til,sist_oppdatert,telefon,adresse,nettside,posisjon) values");
	for (i,skole) in skoler.iter().enumerate() {
		let sfo = match skole.sfo {
			SFO::er_for(_) => "null".to_string(),
			SFO::har(ref navn) => {skoler.iter().position(|s| *s.navn == navn[..] ).unwrap()+1}.to_string(),
			SFO::har_ikke => "null".to_string(),
			SFO::vet_ikke => continue,
		};
		let tlf = match skole.kontakt.and_then(|k| k.telefon ) {
			Some(tlf) => format!("'{}'", str::from_utf8(&tlf[..]).unwrap()),
			None => "null".to_string(),
		};
		let adresse = skole.kontakt.map(|k| k.adresse ).unwrap_or("");
		let url = skole.kontakt.map(|k| k.nettside ).unwrap_or("");
		let pos = skole.kontakt.map(|k| k.koordinater ).unwrap_or("0,0");

		abort_if!(skole.navn.len() > 255, "For langt navn: {:?}", skole.navn);
		abort_if!(adresse.len() > 1000, "For lang adresse: {:?}", adresse);
		abort_if!(url.len() > 1000, "For lang URL: {:?}", url);
		let sep = if i+1 == skoler.len() {';'} else {','};
		println!("\t({},{},'{}','{:?}','{:?}',{},'{}','{}',POINT({})){}",
		         i+1, sfo, skole.navn, skole.data_til.unwrap(), skole.sist_oppdatert,
				 tlf, adresse, url, pos, sep);
	}

	println!("");
	println!("insert into fri (skoleID,dato,ikke_for_ansatte,grunn) values");
	for (i,dag) in fri.iter().enumerate() {
		let sep = if i+1 == fri.len() {';'} else {','};
		println!("\t({},'{:?}',{},'{}'){}",
		         dag.skoleID, dag.dato, dag.ikke_for_ansatte, dag.grunn, sep);
	}
}
