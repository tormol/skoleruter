use std::io::{stderr,Write};
use std::path::Path;
use std::str::FromStr;
use std::borrow::Cow::{Borrowed,Owned};
use std::collections::HashMap;
use std::collections::hash_map::Entry::{Occupied,Vacant};
use common::*;


/// Map key is lowercase school name
/// Err and first parameter is file content
pub type FileReader = fn(String,&Path,Date) -> Result<HashMap<String,Skole<'static>>, String>;
pub const FILE_TYPES: &'static[FileReader] = &[stavanger_ruter,gjesdal_ruter/*,stavanger_skoler*/];

fn sfo_navn(mut skole: &str) -> String {
	if skole.ends_with(" skole") || skole.ends_with(" Skole")
	|| skole.ends_with(" skule") || skole.ends_with(" Skule") {
		skole = &skole[..skole.len()-6];
	} else {
		log!("Tvilsomt SFO-navn: \"{}\" SFO", skole);
	}
	format!("{} SFO", skole)
}

fn ikke_fri(janei: &str, nullable: bool) -> Option<bool> {
	match janei.trim() {
		"Ja" | "ja" => Some(true),
		"Nei" | "nei" => Some(false),
		"Ikke tilgjengelig" if nullable => None,
		feil => abort!("Ugyldig verdi for ja / nei felt: {:?}", feil),
	}
}


fn stavanger_ruter(data: String, path: &Path, sist_oppdatert: Date)
-> Result<HashMap<String,Skole<'static>>, String> {
	match data.lines().next().map(|header| header.to_lowercase() ) {
		None => abort!("{:?} er tom", path),
		Some(header) => {
			if header != "\u{feff}dato,skole,elevdag,laererdag,sfodag,kommentar" {
				return Err(data);
			}
		},
	}
	let data = leak_string(data);


	struct Rad {
		date: Date,
		skole: &'static str,
		elev: bool,
		laerer: bool,
		sfo: bool,
		kommentar: &'static str
	}

	let rader = data.lines()
	                .skip(1)// header
	                .filter(|line| !line.is_empty() )// the last is
	                .map(|line| line.splitn(6, ",").collect::<Vec<_>>() )
	                .inspect(|felt| assert!(felt.len() == 6, "Ugyldig csv") )
					.map(|felt| Rad {
			             date: Date::from_str(felt[0]).unwrap(),
			             skole: felt[1],
			             elev: ikke_fri(felt[2], false).unwrap(),
			             laerer: ikke_fri(felt[3], false).unwrap(),
			             sfo: ikke_fri(felt[4], true).unwrap_or(false),
			             kommentar: felt[5].trim()
	                 })
					.inspect(|rad| assert!(!rad.elev || rad.laerer, "Teacher has left us kids alone") )
					.collect::<Vec<_>>();

	let mut skoler = HashMap::<&'static str,Date>::new();
	for rad in &rader {
		match skoler.entry(rad.skole) {
			Vacant(v) => {v.insert(rad.date);},
			Occupied(ref mut e) if *e.get() < rad.date => {e.insert(rad.date);},
			Occupied(_) => {},
		};
	}
	// FIXME use max date of file
	let mut har_sfo = HashMap::<&'static str,String>::new();
	for rad in &rader {
		if rad.sfo {
			har_sfo.entry(rad.skole).or_insert_with(|| sfo_navn(rad.skole) );
		}
	}

	let sfoer = har_sfo.iter().map(|(&skole, navn)| {
		let fri = rader.iter()
		               .filter(|rad| rad.skole == skole && !rad.sfo )
		               .map(|rad| Fri {
					        date: rad.date,
					        for_ansatte: true,
					        kommentar: rad.kommentar,
				        })
				       .collect::<Vec<_>>();
		Skole {
			navn: Owned(navn.clone()),
			sfo: SFO::er_for(skole.to_lowercase()),
			sist_oppdatert: sist_oppdatert,
			data_til: Some(skoler[skole]),
			kontakt: None,
			fri: fri,
		}
	}).collect::<Vec<_>>();
	let skoler = skoler.into_iter().map(|(navn,data_til)| {
		let fri = rader.iter()
		               .filter(|rad| rad.skole == navn && !rad.elev )
					   .map(|rad| Fri {
						    date: rad.date,
							for_ansatte: !rad.laerer,
							kommentar: rad.kommentar,
					    })
					   .collect::<Vec<_>>();
		let sfo = match har_sfo.remove(navn) {
			Some(sfo) => SFO::har(sfo),
			None => SFO::har_ikke,
		};
		Skole {
			navn: Borrowed(navn),
			sfo: sfo,
			sist_oppdatert: sist_oppdatert,
			data_til: Some(data_til),
			kontakt: None,
			fri: fri,
		}
	});
	let begge = skoler.chain(sfoer);

	Ok(begge.map(|sted| (sted.navn.to_lowercase(), sted) ).collect())
}


fn gjesdal_ruter(content: String, path: &Path, sist_oppdatert: Date)
-> Result<HashMap<String,Skole<'static>>, String> {
	match content.lines().next().map(|header| header.to_lowercase() ) {
		None => abort!("{:?} er tom", path),
		Some(header) => {
			if header != "dato,skole ,elevdag ,sfodag ,kommentar " {
				log!("{}", header);
				return Err(content);
			}
		},
	}
	let content = leak_string(content);

	struct Row {
		date: Date,
		school: &'static str,
		pupils: bool,
		sfo: Option<bool>,
		comment: &'static str
	}

	let rows = content.lines()
	                  .skip(1)// header
	                  .filter(|line| !line.is_empty() )// the last is
	                  .map(|line| line.splitn(5, ",").collect::<Vec<_>>() )
					  .map(|mut part| {
					       if part.len() == 4 {
						       part.push("");
						   }
						   abort_if!(part.len() != 5, "{:?} har veldig ugyldig csv: {:?}", &path, &part);
						   Row {
						       date: Date::parse_from_str(part[0].trim(), "%d.%m.%Y").expect("Ugyldig dato"),
							   school: part[1].trim(),
							   pupils: ikke_fri(part[2], false).unwrap(),
							   sfo: ikke_fri(part[3], true),
							   comment: part[4].trim()
						   }
					   })
					  .collect::<Vec<Row>>();

	let last = rows.iter().map(|row| row.date ).max();
	let mut schools = HashMap::<&'static str,bool>::new();// last date, has sfo
	for row in &rows {
		schools.entry(row.school).or_insert(row.sfo.is_some());
	}

	let mut both = HashMap::new();
	for (school_name,has_sfo) in schools {
		let rows = rows.iter().filter(|r| r.school == school_name ).collect::<Vec<_>>();
		fn to_fri(row: &&Row) -> Fri<'static> {
			Fri {
				date: row.date,
				for_ansatte: true,
				kommentar: row.comment,
			}
		}

		let sfo = if has_sfo {
			let out = rows.iter().filter(|r| match r.sfo {
				Some(sfo) => !sfo,
				None => abort!("SFO for {} er delvis \"Ikke tilgjengelig\"", school_name),
			}).map(to_fri).collect();
			let name = sfo_navn(school_name);
			both.insert(name.to_lowercase(), Skole{
				navn: Owned(name.clone()),
				sfo: SFO::er_for(school_name.to_lowercase()),
				sist_oppdatert: sist_oppdatert,
				data_til: last,
				kontakt: None,
				fri: out,
			});
			SFO::har(name)
		} else {
			SFO::har_ikke
		};

		let out = rows.iter().filter(|r| !r.pupils ).map(to_fri).collect();
		both.insert(school_name.to_lowercase(), Skole {
			navn: Borrowed(school_name),
			sfo: sfo,
			sist_oppdatert: sist_oppdatert,
			data_til: last,
			kontakt: None,
			fri: out,
		});
	}
	Ok(both)
}
