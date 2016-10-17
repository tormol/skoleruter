use std::path::PathBuf;
use std::mem;
use std::sync::Arc;


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
pub struct SkoleDetaljer {
	pub koordinater: &'static str,
	pub adresse: &'static str,
	pub nettside: &'static str,
	pub telefon: Option<[u8;8]>,
}

pub struct SkoleRute {
	pub har_sfo: bool,
	pub har_laerer: bool,
	pub gjelder_fra: Date,
	pub gjelder_til: Date,
	pub fri: Vec<Fri>,
	pub fra_fil: Arc<PathBuf>,
}

pub struct Skole {
	pub navn: &'static str,
	pub om: Option<SkoleDetaljer>,
	pub rute: Option<SkoleRute>,
}

pub struct Fri {
	pub date: Date,
	pub pupils: bool,
	pub teachers: Option<bool>,
	pub afterschool: Option<bool>, 
	pub comment: &'static str,
}

pub fn is_sorted_by_key<E,  I: Iterator<Item=E>+Clone,  C: IntoIterator<Item=E, IntoIter=I>,
                        T: PartialOrd, F: Fn(E)->T >
(into: C, map: F) -> bool {
	let iter = into.into_iter();
	let (a,b) = (iter.clone(), iter);
	let not = a.zip(b.skip(1)).any(|(e,ep1)| map(e) > map(ep1) );
	!not
}
