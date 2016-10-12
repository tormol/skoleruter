use std::fs::File;
use std::io::{stderr,Read,Write};
use std::path::{Path,PathBuf};
use std::str::FromStr;
use std::cmp::max;
use std::collections::{HashMap,BTreeMap};
use std::collections::btree_map::Entry as BTreeEntry;
use std::sync::mpsc::channel;
use std::thread;
use std::mem;
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

	let (send_content,receive_content) = channel::<ParsedFile>();
	let threads = paths.into_iter().map(|path| {
		let sender = send_content.clone();
		let path = PathBuf::from(path);
		thread::spawn(move|| {
			let last_updated = Date::from_str("2020-02-02").unwrap();
			let mut content = read_file(&path);
			for filetype in read::FILE_TYPES {
				match filetype(content, &path, last_updated) {
					Ok(mut schools) => {
						for school in schools.values_mut() {
							if remove_obvious {
								remove_never_school(&mut school.fri);
							}
							set_summer(&mut school.fri, &school.navn);
							juster_sfo_kommentarer(school);
						}
						let pf = ParsedFile{ path: path, skoler: schools };
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

	let mut all = BTreeMap::new();
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
	write::to_sql(all);
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


fn merge_schools(all: &mut BTreeMap<String,Skole>, add: HashMap<String,Skole<'static>>) {
	for (lowercase, add) in add {
		match all.entry(lowercase.clone()) {
			BTreeEntry::Vacant(ve) => {ve.insert(add);},
			BTreeEntry::Occupied(mut oe) => {
				let master = oe.get_mut();
				master.data_til = max(master.data_til, add.data_til);
				master.sist_oppdatert = max(master.sist_oppdatert, add.sist_oppdatert);
				master.fri.extend(add.fri);
				master.fri.sort_by_key(|d| d.date );

				if master.navn == lowercase {
					master.navn = add.navn;
				}
				if add.kontakt.is_some() {
					abort_if!(master.kontakt.is_some(), "Flere filer har kontakt-informasjon for {}", &master.navn);
					master.kontakt = add.kontakt;
				}
				let old = mem::replace(&mut master.sfo, SFO::vet_ikke);
				master.sfo = match (old, add.sfo) {
					(SFO::vet_ikke, n) => n,
					(o, SFO::vet_ikke) => o,
					(SFO::har_ikke, SFO::har(name)) => SFO::har(name),
					(SFO::har(name), SFO::har_ikke) => SFO::har(name),
					(a, b) => if a == b {a}
							  else {abort!("{} er {:?} i en fil, men {:?} i en annen.", master.navn, a, b)}
				};
			}
		}
	}
}

fn juster_sfo_kommentarer(skole: &mut Skole) {
	for dag in &mut skole.fri {
		if dag.kommentar.ends_with("SFO") || dag.kommentar.ends_with("sfo") {
			let separators = dag.kommentar.bytes().rev().skip(3)
			                              .take_while(|&b| b == b' ' || b == b'-' )
										  .count();
			let new_len = dag.kommentar.len() - 3 - separators;
			match skole.sfo {
				SFO::er_for(_) => dag.kommentar = &dag.kommentar[..new_len],
				SFO::har(_) => dag.kommentar = "",
				SFO::har_ikke => log!("{}, som ikke har SFO, har den {} kommentaren {:?}",
				                      &skole.navn, dag.date, dag.kommentar),
				SFO::vet_ikke => abort!("Vet ikke om {} er SFO eller ikke", skole.navn),
			}
		} else if dag.kommentar.contains("SFO") || dag.kommentar.contains("sfo") {
			log!("Kan ikke gjøre noe med kommentaren {:?} for {} ved {}",
			     dag.kommentar, dag.date, &skole.navn);
		}
	}
}

/// Many days in the summer holiday has no comment.
/// This function sets it to "Sommerferie".
fn set_summer(out: &mut[Fri<'static>], school: &str) {
	for day in out {
		if day.kommentar.is_empty() {
			let date = (day.date.month(), day.date.day());
			if date >= (6,10) && date <= (8,24) {
				day.kommentar = "Sommerferie";
			} else {
				log!("Fri uten kommentar: {} ved {}", day.date, school);
			}
		}
	}
}

/// Remove weekends and July
fn remove_never_school(out: &mut Vec<Fri<'static>>) {
	out.retain(|day|
		// weekend, not alle have "Lørdag" or "Søndag" as comment.
		day.date.weekday().number_from_monday() <= 5
		// July
		&& (day.date.month() != 7 /*|| day.kommentar.is_empty()*/)
	);
}
