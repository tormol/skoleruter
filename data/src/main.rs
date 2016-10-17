// #![cfg_attr(feature="clippy", allow(needless_return))]
// #![cfg_attr(feature="clippy", allow(redundant_closure))]

use std::fs::File;
use std::io::{stderr,Read,Write};
use std::path::{Path,PathBuf};
use std::str::FromStr;
use std::collections::{HashMap,BTreeMap};
use std::collections::btree_map::Entry as BTreeEntry;
use std::sync::mpsc::channel;
use std::thread;
extern crate clap;
use clap::App;
extern crate encoding_rs;
use encoding_rs::WINDOWS_1252;// Gjesdals rute er ikke UTF-8
extern crate chrono;
use chrono::Datelike;

#[macro_use]
mod common;
use common::*;
mod read;
mod write;


fn main() {
	let (paths,remove_obvious) = args();
	let last_updated = Date::from_str("2020-02-02").unwrap();

	let (send_content,receive_content) = channel::<HashMap<String,Skole>>();
	let threads = paths.into_iter().map(|path| {
		let sender = send_content.clone();
		let path = PathBuf::from(path);
		thread::spawn(move|| {
			let mut content = read_file(&path);
			for filetype in read::FILE_TYPES {
				match filetype(content, &path) {
					Ok(mut schools) => {
						for school in schools.values_mut() {
							if let Some(rute) = school.rute.as_mut() {
								if remove_obvious {
									remove_never_school(&mut rute.fri);
								}
								set_summer(&mut rute.fri, school.navn);
								if !is_sorted_by_key(&rute.fri, |day| day.date ) {
									rute.fri.sort_by_key(|day| day.date );
								}
							}
						}
						let _ = sender.send(schools);// No need to propagate panic in the main thread.
						return;
					},
					Err(string) => content = string,
				}
			}
			abort!("Forstår ikke hva {:?} er.", &path);
		})
	}).collect::<Vec<_>>();
	drop(send_content);

	let mut all = BTreeMap::new();
	for schools in receive_content.iter() {
		merge_schools(&mut all, schools);
	}
	for t in threads {
		t.join().unwrap();// catch panics
	}

	let all = all.into_iter()
	             .map(|(_,v)| v )
	             .filter(|skole| skole.rute.is_some() )
	             .collect::<Vec<_>>();
	let stdout = std::io::stdout();
	let mut stdout = stdout.lock();
	write::as_format("sql_old")(&mut stdout, all, last_updated);
}

fn args() -> (Vec<PathBuf>,bool) {
	let matches = App::new("finn_fri")
	                  .version("0.1")
	                  .author("Gruppe 5")
	                  .about("konverterer skoleruter og skole-info til SQL")
	                  .args_from_usage("--remove-obvious `Ikke nevn fridager i Juli eller helger`
	                                    <file.csv>... 'kan enten være en skolerute eller skole-info, tolkes ut i fra'")
	                  .get_matches();
	let remove_obvious = matches.is_present("remove-obvious");
	let paths = matches.values_of_os("file.csv").unwrap_or_else(||
		abort!("Ingen filer")
	);
	let paths = paths.map(|s| PathBuf::from(s) ).collect();
	(paths,remove_obvious)
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


fn merge_schools(all: &mut BTreeMap<String,Skole>, add: HashMap<String,Skole>) {
	for (lowercase, add) in add {
		match all.entry(lowercase.clone()) {
			BTreeEntry::Vacant(ve) => {ve.insert(add);},
			BTreeEntry::Occupied(mut oe) => {
				let existing = oe.get_mut();

				if existing.navn == lowercase {
					existing.navn = add.navn;
				}
				if add.om.is_some() {
					abort_if!(existing.om.is_some(), "Flere filer har kontakt-informasjon for {}", &existing.navn);
					existing.om = add.om;
				}
				if let Some(extend) = existing.rute.as_mut() {
					if let Some(add) = add.rute {
						extend.har_laerer |= add.har_laerer;
						extend.har_sfo |= add.har_sfo;
						extend.fri.extend(add.fri);
				 		extend.fri.sort_by_key(|d| d.date );
						if extend.gjelder_til < add.gjelder_fra {
							extend.gjelder_til = add.gjelder_til;
						} else if extend.gjelder_fra > add.gjelder_til {
							extend.gjelder_fra = add.gjelder_fra;
						} else {
							abort!("{:?} og {:?} har overlappende datoer for {}",
							       extend.fra_fil, add.fra_fil, existing.navn);
							// TODO assert contigious years;
							// How do we handle more than two years arriving out of order?
							// It shouldn't be a problem after we check current date,
							// because I doubt the schedule is known more than a year in advance.
							// Also, fra_fil can only hold one value (and is not updated),
							// but fra_fil shouldn't be needed after here.
						}
					}
				}
			}
		}
	}
}

/// Many days in the summer holiday has no comment.
/// This function sets it to "Sommerferie".
fn set_summer(out: &mut[Fri], school: &str) {
	for day in out {
		if day.comment.is_empty() {
			let date = (day.date.month(), day.date.day());
			if date >= (6,10) && date <= (8,24) {
				day.comment = "Sommerferie";
			} else {
				log!("Fri uten kommentar: {} ved {}", day.date, school);
			}
		}
	}
}

/// Remove weekends and July
fn remove_never_school(out: &mut Vec<Fri>) {
	out.retain(|day|
		// weekend, not alle have "Lørdag" or "Søndag" as comment.
		day.date.weekday().number_from_monday() <= 5
		// July
		&& (day.date.month() != 7 /*|| day.kommentar.is_empty()*/)
	);
}
