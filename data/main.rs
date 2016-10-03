use std::fs::File;
use std::io::{stderr,Read,Write};
use std::path::{Path,PathBuf};
use std::str::FromStr;
use std::borrow::Cow::{self,Borrowed,Owned};
use std::cmp::{Ordering,max};
use std::collections::HashMap;
use std::collections::hash_map::Entry::{Occupied,Vacant};
use std::sync::mpsc::channel;
use std::thread;
extern crate clap;
use clap::App;
extern crate encoding_rs;
use encoding_rs::WINDOWS_1252;// Gjesdals rute er ikke UTF-8
extern crate chrono;
use chrono::{NaiveDate,Datelike};



macro_rules! log {($format:expr $(,$arg:expr)*) => {{
	let _ = writeln!(stderr(), $format $(,$arg)*);
}}}
macro_rules! abort {($format:expr $(,$arg:expr)*) => {{
	log!($format $(,$arg)*);
	std::process::exit(1)
}}}
macro_rules! abort_if {($cond:expr, $format:expr $(,$arg:expr)*) => {{
	if $cond {
		abort!($format $(,$arg)*)
	}
}}}
fn leak_string(mut s: String) -> &'static mut str {
	use std::mem::{transmute,forget};
	unsafe {
		let slice: &'static mut str = transmute(s.as_mut_str());
		forget(s);
		slice
	}
}


type Date = NaiveDate;

#[derive(Clone,Copy)]
struct SkoleDetaljer<'a> {
	koordinater: &'a str,
	adresse: &'a str,
	nettside: &'a str,
	telefon: Option<[u8;8]>,
}

#[allow(non_camel_case_types)]
#[derive(PartialEq,Eq)]
enum SFO {
	er,
	har_ikke,
	har(String),
}

struct Skole<'a> {
	navn: Cow<'a,str>,
	sfo: SFO,
	sist_oppdatert: Date,
	data_til: Option<Date>,
	kontakt: Option<SkoleDetaljer<'a>>,
	fri: Vec<Fri<'a>>,
}

struct Fri<'a> {
    date: Date,
	for_ansatte: bool,
    kommentar: &'a str,
}

struct ParsedFile {
	path: PathBuf,
	skoler: HashMap<String, Skole<'static>>,// navn med små bokstaver,
}


fn main() {
	let paths = args();

	let (send_content,receive_content) = channel::<ParsedFile>();
	let threads = paths.into_iter().map(|path| {
		let sender = send_content.clone();
		let path = PathBuf::from(path);
		thread::spawn(move|| {
			let sist_oppdatert = Date::from_str("2020-02-02").unwrap();
			let mut content = read_file(&path);
			for filetype in FILE_TYPES {
				match filetype(content, &path, sist_oppdatert) {
					Ok(mut skoler) => {
						for skole in skoler.values_mut() {
							juster_sfo_kommentarer(skole);
							rens_fri(&mut skole.fri, &skole.navn);
						}
						let pf = ParsedFile{ path: path, skoler: skoler };
						let _ = sender.send(pf);// No need to propagate panic in the main thread.
						return;
					},
					Err(string) => content = string,
				}
			}
			abort!("Forstår ikke hva {:?} er.", &path);
		})
	}).collect::<Vec<_>>();
	drop(send_content);

	let mut all = HashMap::new();
	for content in receive_content.iter() {
		merge_schools(&mut all, content.skoler);
	}
	for t in threads {
		t.join().unwrap();// catch panics
	}

	let all = all.into_iter()
	             .map(|(_,v)| v )
			     .filter(|skole| skole.fri.len() != 0 )
	             .collect::<Vec<_>>();
	to_sql(all);
}

fn args() -> Vec<PathBuf> {
	let matches = App::new("finn_fri")
                      .version("0.1")
                      .author("Gruppe 5")
                      .about("konverterer skoleruter og skole-info til SQL")
                      .args_from_usage("<fil.csv>... 'kan enten være en skolerute eller skole-info, tolkes ut i fra'")
                      .get_matches();
	let paths = matches.values_of_os("fil.csv").unwrap_or_else(||
		abort!("Ingen filer")
	);
	paths.map(|s| PathBuf::from(s) ).collect()
}

fn read_file(path: &Path) -> String {
	let mut file = File::open(path).unwrap_or_else(|err|
		abort!("Kan ikke åpne {:?}: {}", path, err)
	);
	let size = file.metadata().map(|m| m.len() as usize ).unwrap_or(0);
	let mut content = Vec::with_capacity(size);
	file.read_to_end(&mut content).unwrap_or_else(|err|
		abort!("Feil under lesing av {:?}: {}", path, err)
	);
	String::from_utf8(content).unwrap_or_else(|err| {
		let content = err.into_bytes();
		let (s,encoding,errors) = WINDOWS_1252.decode(&content);
		if errors || encoding != WINDOWS_1252 {
			log!("{:?} er hverken UTF-8 eller WINDOWS_1252", path);
		}
		s
	})
}


fn merge_schools(all: &mut HashMap<String,Skole>, add: HashMap<String,Skole<'static>>) {
	for (lowercase, add) in add {
		match all.entry(lowercase.clone()) {
			Vacant(ve) => {ve.insert(add);},
			Occupied(mut oe) => {
				let master = oe.get_mut();
				master.data_til = max(master.data_til, add.data_til);
				master.sist_oppdatert = max(master.sist_oppdatert, add.sist_oppdatert);
				master.fri.extend(add.fri);
				if master.navn == lowercase {
					master.navn = add.navn;
				}
				if add.kontakt.is_some() {
					abort_if!(master.kontakt.is_some(), "Flere filer har kontakt-informasjon for {}", &master.navn);
					master.kontakt = add.kontakt;
				}
			}
		}
	}
}


fn to_sql(mut skoler: Vec<Skole>) {
	abort_if!(skoler.len() > std::u16::MAX as usize,
	          "Database-skjemaet må oppdateres: for mange skoler: {}", skoler.len() );
	// IDs to SFOs must already exists
	skoler.sort_by_key(|s| match s.sfo {
		SFO::er       => Ordering::Less,
		SFO::har_ikke => Ordering::Equal,
		SFO::har(_)   => Ordering::Greater,
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
			SFO::er => "null".to_string(),
			SFO::har(ref navn) => {skoler.iter().position(|s| *s.navn == navn[..] ).unwrap()+1}.to_string(),
			SFO::har_ikke => "null".to_string(),
		};
		let tlf = match skole.kontakt.and_then(|k| k.telefon ) {
			Some(tlf) => format!("'{}'", std::str::from_utf8(&tlf[..]).unwrap()),
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


fn juster_sfo_kommentarer(skole: &mut Skole) {
	for dag in &mut skole.fri {
		if dag.kommentar.ends_with(" SFO") || dag.kommentar.ends_with(" sfo") {
			let mut new_len = dag.kommentar.len() - 4;
			if dag.kommentar[..new_len].ends_with(" -") {
				new_len -= 2;
			}
			match skole.sfo {
				SFO::er => dag.kommentar = &dag.kommentar[..new_len],
				SFO::har(_) => dag.kommentar = "",
				SFO::har_ikke => log!("{}, som ikke har SFO, har den {} kommentaren {:?}",
				                      &skole.navn, dag.date, dag.kommentar),
			}
		} else if dag.kommentar.contains("SFO") || dag.kommentar.contains("sfo") {
			log!("Kan ikke gjøre noe med kommentaren {:?} for {} ved {}",
			     dag.kommentar, dag.date, &skole.navn);
		}
	}
}

/// Fjern helger, Juli og sett kommentar for sommerferie
fn rens_fri(dager: &mut Vec<Fri<'static>>, skole: &str) {
	for i in (0..dager.len()).rev() {
		let date = dager[i].date;
		// if date.weekday().number_from_monday() > 5 {
		// 	// helg, ikke alle har kommentar Lørdag eller Søndag
		// 	dager.swap_remove(i);
		// }
		if dager[i].kommentar.is_empty() {
			match dager[i].date.month() {
				6 if date.day() >= 10 => dager[i].kommentar = "sommerferie",
				7 => {/*dager.swap_remove(i);*/},
				8 if date.day() <= 23 => dager[i].kommentar = "sommerferie",
				_ => log!("Fri uten kommentar: {} ved {}", date, skole),
			}
		}
	}
}



fn sfo_navn(mut skole: &str) -> String {
	if skole.ends_with(" skole") {
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


/// Map key is lowercase school name
/// Err and first parameter is file content
type FileReader = fn(String,&Path,Date) -> Result<HashMap<String,Skole<'static>>, String>;
const FILE_TYPES: &'static[FileReader] = &[stavanger_ruter,gjesdal_ruter/*,stavanger_skoler*/];

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
			sfo: SFO::er,
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
				sfo: SFO::er,
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