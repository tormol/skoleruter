use std::io::{stderr,Write};
use std::str;
use common::*;

pub type FormatWriter = fn(&mut Write, Vec<Skole>, Date);
pub fn as_format(typ: &str) -> FormatWriter {match typ {
	"json_skole_hvem" => json_skole_hvem,
	"sql_old" => abort!("sql_old er ikke vedlikeholdt"),
	"json_samlet"  => abort!("json_samlet er ikke vedlikeholdt"),
	_ => abort!("Ukjent ut-format: {:?}", typ)
}}

macro_rules! w {($dest:expr, $format:expr $(,$arg:expr)*) => {
	if let Err(e) = write!($dest, $format $(,$arg)*) {
		abort!("Feil under skriving: {:?} (type: {:?})", &e, e.kind());
	}
}}


fn json_skole_hvem(dst: &mut Write,  skoler: Vec<Skole>,  sist_oppdatert: Date) {
	fn w_fri(dst: &mut Write,  fri: Option<Vec<Fri>>,  siste: bool) {
		if let Some(fri) = fri {
			w!(dst, "{{\n");
			foreach_mark_last(fri, |siste,fri| {
				w!(dst, "\"{}\":{:?}", fri.dato, fri.kommentar);
				w!(dst, "{}", if siste {"\n"} else {", "} );
			});
			w!(dst, "\t\t}}");
		} else {
			w!(dst, "null");
		}
		w!(dst, "{}\n", if siste {""} else {","})
	}
	w!(dst, "{{\n");
	w!(dst, "\"sist_oppdatert\": \"{}\",\n", sist_oppdatert);
	w!(dst, "\"verjon\": [4,0],\n");
	w!(dst, "\"skoler\": {{\n");
	foreach_mark_last(skoler, |siste, skole| {
		w!(dst, "\t{:?}: {{\n", skole.navn);
		match skole.om.and_then(|om| om.telefon ) {
			Some(tlf) => w!(dst, "\t\t\"tlf\": {:?},\n", str::from_utf8(&tlf[..]).unwrap()),
			None      => w!(dst, "\t\t\"tlf\": null,\n"),
		}
		if let Some(om) = skole.om {
			w!(dst, "\t\t\"adresse\" : {:?},\n", om.adresse);
			w!(dst, "\t\t\"nettside\": {:?},\n", om.nettside);
			w!(dst, "\t\t\"posisjon\": [\"{}\",\"{}\"],\n", om.posisjon[0], om.posisjon[1]);
		} else {
			w!(dst, "\t\t\"adresse\" : null,\n");
			w!(dst, "\t\t\"nettside\": null,\n");
			w!(dst, "\t\t\"posisjon\": null,\n");
		}
		let rute = skole.rute.unwrap();
		w!(dst, "\t\t\"gjelder\": [\"{}\",\"{}\"],\n", rute.gjelder_fra, rute.gjelder_til);
		w!(dst, "\t\t\"elever\": ");
		w_fri(dst, Some(rute.elever), false);
		w!(dst, "\t\t\"lærere\": ");
		w_fri(dst, rute.laerere, false);
		w!(dst, "\t\t\"sfo\": ");
		w_fri(dst, rute.sfo, true);
		w!(dst, "\t}}{}\n", if siste {""} else {","} );
	});
	w!(dst, "}}}}\n");
}
