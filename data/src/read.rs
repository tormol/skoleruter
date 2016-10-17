use std::io::{stderr,Write};
use std::path::PathBuf;
use std::str::FromStr;
use std::collections::HashMap;
use std::sync::Arc;
use chrono::Datelike;
use common::*;


/// Map key is lowercase school name
/// Err and first parameter is file content
pub type FileReader = fn(String,&Arc<PathBuf>) -> Result<HashMap<String,Skole>, String>;
pub const FILE_TYPES: &'static[FileReader] = &[stavanger_ruter,gjesdal_ruter,stavanger_skoler];

macro_rules! is_if_header{($content:expr, $f:expr) => (
	if !$f($content.lines().next().unwrap()) {
		return Err($content);
	}
)}


fn ikke_fri(janei: &str, nullable: bool) -> Option<bool> {
	match janei.trim() {
		"Ja" | "ja" => Some(true),
		"Nei" | "nei" => Some(false),
		"Ikke tilgjengelig" if nullable => None,
		feil => abort!("Ugyldig verdi for ja / nei felt: {:?}", feil),
	}
}

fn update_min_max(current_min: &mut Date,  current_max: &mut Date,  new: Date) {
	if *current_min > new {
		*current_min = new;
	}
	if *current_max < new {
		*current_max = new;
	}
}

/// Many days in the summer holiday has no comment.
/// This function sets it to "Sommerferie".
fn set_summer(out: &mut[Fri], school: &str) {
	for day in out {
		if day.kommentar.is_empty() {
			let date = (day.dato.month(), day.dato.day());
			if date >= (6,10) && date <= (8,24) {
				day.kommentar = "Sommerferie";
			} else {
				log!("Fri uten kommentar: {} ved {}", day.dato, school);
			}
		}
	}
}

fn juster_sfo_kommentarer(skole: &str, rute: &mut SkoleRute) {
	fn kommentar_for_sfo(skole: &str,  fri: &mut[Fri],  f: &Fn(&'static str, &mut Fri)) {
		for dag in fri {
			if dag.kommentar.ends_with("SFO") || dag.kommentar.ends_with("sfo") {
				let separatorer = dag.kommentar.bytes().rev().skip(3)
											.take_while(|&b| b == b' ' || b == b'-' )
											.count();
				let uten = dag.kommentar.len() - 3 - separatorer;
				let uten = &dag.kommentar[..uten];
				f(uten, dag);
			} else if dag.kommentar.contains("SFO") || dag.kommentar.contains("sfo") {
				log!("Kan ikke gjøre noe med kommentaren {:?} for {} ved {}",
					dag.kommentar, dag.dato, skole);
			}
		}
	}

	let har_sfo = rute.sfo.is_some();
	let f = |_, fri: &mut Fri| {
		if !har_sfo {
			log!("{}, som ikke har sfo, har den {} kommentaren {:?}",
				 skole, fri.dato, fri.kommentar);
		}
		fri.kommentar = "";
	};
	kommentar_for_sfo(skole, &mut rute.elever, &f);
	if let Some(ref mut laerere) = rute.laerere {
		kommentar_for_sfo(skole, laerere, &f);
	}

	if let Some(ref mut sfo) = rute.sfo {
		kommentar_for_sfo(skole, sfo, &|uten, fri| fri.kommentar = uten );
	}
}


fn to_school<I:Iterator<Item=(&'static str,SkoleRute)>>
(skoler: I) -> HashMap<String,Skole> {
	skoler.map(|(navn, mut rute)| {
		juster_sfo_kommentarer(navn, &mut rute);
		for fri in rute.iter_mut_fri() {
			set_summer(fri, navn);
			if !is_sorted_by_key(&fri[..], |fri| fri.dato ) {
				fri.sort_by_key(|fri| fri.dato );
			}
		}

		let skole = Skole {
			navn: navn,
			om: None,
			rute: Some(rute)
		};
		(skole.navn.to_lowercase(), skole)
	}).collect()
}

fn stavanger_ruter(content: String,  path: &Arc<PathBuf>)
-> Result<HashMap<String,Skole>, String> {
	is_if_header!(content, |header: &str| {
		header.to_lowercase() =="\u{feff}dato,skole,elevdag,laererdag,sfodag,kommentar"
	});
	let content = leak_string(content);

	struct Row {// true => there is school/work/afterschool
		date: Date,
		school: &'static str,
		pupils: bool,
		teachers: bool,
		afterschool: bool,
		comment: &'static str,
		line: usize,
	}
	let rows = content.lines().enumerate()
	                  .skip(1)// header
	                  .filter(|&(_,line)| !line.is_empty() )// the last is
	                  .map(|(i,line)| (i+1, line.splitn(6, ',').collect::<Vec<_>>()) )
	                  .inspect(|&(n, ref fields)| {
	                           abort_if!(fields.len() != 6, "{:?}:{}: Ugyldig csv", path, n)
	                   })
	                  .map(|(n,fields)| Row {
	                       date: Date::from_str(fields[0]).unwrap(),
	                       school: fields[1],
	                       pupils: ikke_fri(fields[2], false).unwrap(),
	                       teachers: ikke_fri(fields[3], false).unwrap(),
	                       afterschool: ikke_fri(fields[4], true).unwrap_or(false),
	                       comment: fields[5].trim(),
	                       line: n,
	                   })
	                  .inspect(|row| {
	                           abort_if!(row.pupils && !row.teachers,
	                                     "{:?}:{}: Teacher has left us kids alone", path, row.line)
	                   });

	let mut schools = HashMap::<&str,(SkoleRute,bool)>::new();
	for row in rows {
		let to = schools.entry(row.school)
		                .or_insert_with(|| (SkoleRute::new(true, &path), false) );
		let &mut(ref mut rute, ref mut har_sfo) = to;

		*har_sfo |= row.afterschool;

		let fri = Fri{ dato: row.date, kommentar: row.comment };
		if !row.pupils {
			rute.elever.push(fri);
		}
		if !row.afterschool {
			rute.sfo.as_mut().unwrap().push(fri);
		}
		if !row.teachers {
			rute.laerere.as_mut().unwrap().push(fri);
		}
		update_min_max(&mut rute.gjelder_fra, &mut rute.gjelder_til, row.date);
	}

	let schools = schools.into_iter().map(|(navn, (mut rute, har_sfo))| {
		if !har_sfo {
			rute.sfo = None;
		}
		(navn, rute)
	});
	return Ok(to_school(schools));
}


fn gjesdal_ruter(content: String,  path: &Arc<PathBuf>)
-> Result<HashMap<String,Skole>, String> {
	is_if_header!(content, |header: &str| {
		header.to_lowercase() == "dato,skole ,elevdag ,sfodag ,kommentar "
	});
	let content = leak_string(content);

	struct Row {
		date: Date,
		school: &'static str,
		pupils: bool,
		afterschool: Option<bool>,
		comment: &'static str
	}
	let rows = content.lines().enumerate()
	                  .skip(1)// header
	                  .filter(|&(_,line)| !line.is_empty() )// the last is
	                  .map(|(n,line)| (n+1,line.splitn(5, ',').collect::<Vec<_>>()) )
	                  .map(|(line_nr,mut part)| {
	                       if part.len() == 4 {
	                           part.push("");
	                       }
	                       abort_if!(part.len() != 5,
	                                 "{:?}:{} har veldig ugyldig csv: {:?}", path, line_nr, &part);
	                       Row {
	                           date: Date::parse_from_str(part[0].trim(), "%d.%m.%Y").expect("Ugyldig dato"),
	                           school: part[1].trim(),
	                           pupils: ikke_fri(part[2], false).unwrap(),
	                           afterschool: ikke_fri(part[3], true),
	                           comment: part[4].trim()
	                       }
	                   });

	let mut schools = HashMap::<&str,SkoleRute>::new();
	for row in rows {
		let rute = schools.entry(row.school)
		                  .or_insert_with(|| SkoleRute::new(false, &path) );
		if !row.pupils {
			rute.elever.push(Fri{ dato: row.date, kommentar: row.comment });
		}
		match (row.afterschool, rute.sfo.as_mut()) {
			(Some(false), Some(sfo)) => sfo.push(Fri{ dato: row.date, kommentar: row.comment }),
			(Some(true), Some(_)) => {},
			(Some(_), None) => abort!("{}s sfo eksisterer bare av og til", row.school),
			(None, Some(ref sfo)) if sfo.len() != 0
			 => abort!("{}s sfo eksisterer bare av og til", row.school),
			(None, ref mut sfo) => *sfo = None,
		}
		update_min_max(&mut rute.gjelder_fra, &mut rute.gjelder_til, row.date);
	}

	return Ok(to_school(schools.into_iter()));
}


fn stavanger_skoler(content: String,  path: &Arc<PathBuf>)
-> Result<HashMap<String,Skole>, String> {
	is_if_header!(content, |header: &str| {
		let header = header.to_lowercase();
		let field = header.split(',').collect::<Vec<_>>();
		// 0=Nord, 1=øst, 2=Latitude, 3=Longitude, 4=ID, 5=OBJTYPE, 6=KOMM, 7=BYGGTYP_NBR, 8=INFORMASJON,
		// 9=Skolenavn, 10=ADRESSE, 11=Hjemmeside, 12=ELEVER, 13=KAPASITET
		field.len() >= 11
		&&  field[2] == "latitude"  &&  field[3] == "longitude"
		&&  field[9] == "skolenavn"  &&  field[10] == "adresse"  &&  field[11] == "hjemmeside"
	});
	let content = leak_string(content);

	let om = content.lines().enumerate()
	                .skip(1).filter(|&(_,line)| !line.is_empty() )
	                .map(|(n, line)| (n+1, line.split(',').collect::<Vec<_>>()) )
	                .inspect(|&(linenr, ref field)| {
	                         abort_if!(field.len() < 10, "{:?}:{}: Ugyldig csv", path, linenr);
	                 })
	                .map(|(_, field)| Skole {
	                     navn: field[9].trim(),
	                     om: Some( SkoleDetaljer {
	                         posisjon: [field[2].trim(), field[3].trim()],
	                         adresse: field[10].trim(),
	                         nettside: field[11].trim(),
	                         telefon: None
	                     }),
	                     rute: None,
	                 })
	                .map(|skole| (skole.navn.to_lowercase(), skole) );

	return Ok(om.collect());
}
