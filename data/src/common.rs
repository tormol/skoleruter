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
	pub posisjon: [&'static str;2],
	pub adresse: &'static str,
	pub nettside: &'static str,
	pub telefon: Option<[u8;8]>,
}

pub struct SkoleRute {
	pub elever: Vec<Fri>,
	pub laerere: Option<Vec<Fri>>,
	pub sfo: Option<Vec<Fri>>, 
	pub gjelder_fra: Date,
	pub gjelder_til: Date,
	pub fra_fil: Arc<PathBuf>,
}
impl SkoleRute {
	pub fn new(har_laerere: bool, fra_fil: &Arc<PathBuf>) -> Self {SkoleRute {
		elever: Vec::new(),
		laerere: if har_laerere {Some(Vec::new())} else {None},
		sfo: Some(Vec::new()),
		gjelder_fra: Date::from_ymd(3000,12,31),
		gjelder_til: Date::from_ymd(1000,01,01),
		fra_fil: fra_fil.clone(),
	}}
	pub fn iter_mut_fri(&mut self) -> ::std::vec::IntoIter<&mut Vec<Fri>> {
		let mut v = vec![&mut self.elever];
		if let Some(laerere) = self.laerere.as_mut() {
			v.push(laerere);
		}
		if let Some(sfo) = self.sfo.as_mut() {
			v.push(sfo);
		}
		v.into_iter()
	}
}

pub struct Skole {
	pub navn: &'static str,
	pub om: Option<SkoleDetaljer>,
	pub rute: Option<SkoleRute>,
}

#[derive(Copy,Clone)]
pub struct Fri {
	pub dato: Date,
	pub kommentar: &'static str,
}

pub fn is_sorted_by_key<E,  I: Iterator<Item=E>+Clone,  C: IntoIterator<Item=E, IntoIter=I>,
                        T: PartialOrd, F: Fn(E)->T >
(into: C, map: F) -> bool {
	let iter = into.into_iter();
	let (a,b) = (iter.clone(), iter);
	let not = a.zip(b.skip(1)).any(|(e,ep1)| map(e) > map(ep1) );
	!not
}

pub fn foreach_mark_last<E,  I: Iterator<Item=E>,  C: IntoIterator<Item=E, IntoIter=I>,  F: FnMut(bool,E)>
(into: C, mut f: F) {
	let mut iter = into.into_iter().peekable();
	while let Some(e) = iter.next() {
		let is_last = !iter.peek().is_some();
		f(is_last, e);
	}
}
