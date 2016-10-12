use std::path::PathBuf;
use std::borrow::Cow;
use std::collections::HashMap;
use std::mem;


macro_rules! log {($format:expr $(,$arg:expr)*) => {{
	let _ = writeln!(stderr(), $format $(,$arg)*);
}}}
macro_rules! abort {($format:expr $(,$arg:expr)*) => {{
	log!($format $(,$arg)*);
	::std::process::exit(1)
}}}
macro_rules! abort_if {($cond:expr, $format:expr $(,$arg:expr)*) => {{
	if $cond {
		abort!($format $(,$arg)*)
	}
}}}
pub fn leak_string(mut s: String) -> &'static mut str {
	unsafe {
		let slice: &'static mut str = mem::transmute(s.as_mut_str());
		mem::forget(s);
		slice
	}
}

pub type Date = ::chrono::NaiveDate;

#[derive(Clone,Copy)]
pub struct SkoleDetaljer<'a> {
	pub koordinater: &'a str,
	pub adresse: &'a str,
	pub nettside: &'a str,
	pub telefon: Option<[u8;8]>,
}

#[allow(non_camel_case_types)]
#[derive(PartialEq,Eq, Debug)]
pub enum SFO {// Strings are lowercase
	vet_ikke,
	er_for(String),
	har_ikke,
	har(String),
}

pub struct Skole<'a> {
	pub navn: Cow<'a,str>,
	pub sfo: SFO,
	pub sist_oppdatert: Date,
	pub data_til: Option<Date>,
	pub kontakt: Option<SkoleDetaljer<'a>>,
	pub fri: Vec<Fri<'a>>,
}

pub struct Fri<'a> {
    pub date: Date,
	pub for_ansatte: bool,
    pub kommentar: &'a str,
}

pub struct ParsedFile {
	pub path: PathBuf,
	pub skoler: HashMap<String, Skole<'static>>,// navn med små bokstaver,
}
