// #![cfg_attr(feature="clippy", allow(needless_return))]
// #![cfg_attr(feature="clippy", allow(redundant_closure))]

use std::fs::File;
use std::io::{stderr,Read,Write};
use std::path::{Path,PathBuf};
use std::str::FromStr;
use std::collections::{HashMap,BTreeMap};
use std::collections::btree_map::Entry as BTreeEntry;
use std::sync::mpsc::{channel,Sender};
use std::sync::Arc;
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
	let (paths,output,remove_obvious) = args();
	let last_updated = Date::from_str("2020-02-02").unwrap();

	let (send_content,receive_content) = channel::<HashMap<String,Skole>>();
	let threads = paths.into_iter().map(|path| {
		let sender = send_content.clone();
		let path = PathBuf::from(path);
		thread::spawn(move|| parse_thread(sender, path, remove_obvious) )
	}).collect::<Vec<_>>();
	drop(send_content);

	let mut all = BTreeMap::<String,Skole>::new();
	for schools in receive_content.iter() {
		merge_files(&mut all, schools);
	}
	for t in threads {
		t.join().unwrap();// catch panics
	}

	let all = all.into_iter()
	             .map(|(_,v)| v )
	             .filter(|skole| skole.rute.is_some() )
	             .collect::<Vec<_>>();
	let output = output.unwrap_or("json_skole_hvem".to_string());
	let stdout = std::io::stdout();
	let mut stdout = stdout.lock();
	write::as_format(&output)(&mut stdout, all, last_updated);
}


fn args() -> (Vec<PathBuf>,Option<String>,bool) {
	let matches = App::new("finn_fri")
	                  .version("0.1")
	                  .author("Gruppe 5")
	                  .about("konverterer skoleruter og skole-info til SQL")
	                  .args_from_usage("--remove-obvious `Ikke nevn fridager i Juli eller helger`
	                                    --output=[format] `Velg format`
	                                    <file.csv>... 'kan enten være en skolerute eller skole-info, tolkes ut i fra'")
	                  .get_matches();
	let remove_obvious = matches.is_present("remove-obvious");
	let output = matches.value_of("output").map(|s| s.to_string() );
	let paths = matches.values_of_os("file.csv").unwrap_or_else(||
		abort!("Ingen filer")
	);
	let paths = paths.map(|s| PathBuf::from(s) ).collect();
	(paths,output,remove_obvious)
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

fn parse_thread(sender: Sender<HashMap<String,Skole>>,  path: PathBuf,  remove_obvious: bool) {
	let mut content = read_file(&path);
	if content.is_empty() {
		abort!("{:?} er tom", path);
	}
	let path = Arc::new(path);
	for filetype in read::FILE_TYPES {
		match filetype(content, &path) {
			Ok(mut skoler) => {
				if remove_obvious {
					for fri in skoler.values_mut()
					                 .filter_map(|skole| skole.rute.as_mut() )
									 .flat_map(|rute| rute.iter_mut_fri() ) {
						remove_never_school(fri);
					}
				}
				let _ = sender.send(skoler);// No need to propagate panic in the main thread.
				return;
			},
			Err(string) => content = string,
		}
	}
	abort!("Forstår ikke hva {:?} er.", &path);
}

fn merge_files(all: &mut BTreeMap<String,Skole>, add: HashMap<String,Skole>) {
	for (lowercase, add) in add {
		match all.entry(lowercase.clone()) {
			BTreeEntry::Vacant(ve) => {ve.insert(add);},
			BTreeEntry::Occupied(mut oe) => {
				let existing = oe.get_mut();

				if existing.navn == lowercase {
					existing.navn = add.navn;
					// TODO make names deterministic
				}
				if add.om.is_some() {
					abort_if!(existing.om.is_some(), "Flere filer har kontakt-informasjon for {}", &existing.navn);
					existing.om = add.om;
				}
				if !existing.rute.is_some() {
					// must be this order due to moves (and lexical lifetimes)
					existing.rute = add.rute;
				} else if let Some(extend) = existing.rute.as_mut() {
					if let Some(add) = add.rute {
						fn merge_fri(extend: &mut Vec<Fri>,  add: Vec<Fri>) {
							extend.extend(add);
							if !is_sorted_by_key(&extend[..], |fri| fri.dato ) {
				 				extend.sort_by_key(|fri| fri.dato );
							}
						}
						fn merge_opt_fri(extend: &mut Option<Vec<Fri>>,  add: Option<Vec<Fri>>) {
							if let Some(add) = add {
								match *extend {
									Some(ref mut extend) => merge_fri(extend, add),
									None => *extend = Some(add),
								}
							}
						}

						merge_fri(&mut extend.elever, add.elever);
						merge_opt_fri(&mut extend.laerere, add.laerere);
						merge_opt_fri(&mut extend.sfo, add.sfo);
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


/// Remove weekends and July
fn remove_never_school(out: &mut Vec<Fri>) {
	out.retain(|fri|
		// weekend, not alle have "Lørdag" or "Søndag" as comment.
		fri.dato.weekday().number_from_monday() <= 5
		// July
		&& (fri.dato.month() != 7 /*|| fri.kommentar.is_empty()*/)
	);
}
