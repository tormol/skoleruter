use std::io::{stderr,Write};
use std::path::Path;
use std::str::FromStr;
use std::collections::HashMap;
use std::sync::Arc;
use common::*;


/// Map key is lowercase school name
/// Err and first parameter is file content
pub type FileReader = fn(String,&Path) -> Result<HashMap<String,Skole>, String>;
pub const FILE_TYPES: &'static[FileReader] = &[stavanger_ruter,gjesdal_ruter/*,stavanger_skoler*/];

fn ikke_fri(janei: &str, nullable: bool) -> Option<bool> {
	match janei.trim() {
		"Ja" | "ja" => Some(true),
		"Nei" | "nei" => Some(false),
		"Ikke tilgjengelig" if nullable => None,
		feil => abort!("Ugyldig verdi for ja / nei felt: {:?}", feil),
	}
}

fn to_school<I:Iterator<Item=(&'static str,bool,Vec<Fri>)>>
(schools: I, has_teachers: bool, file: &Path) -> HashMap<String,Skole> {
	let file = Arc::new(file.to_owned());
	schools.map(|(name, has_afterschool, mut fri)| {
		let first_date = fri.iter().map(|day| day.date ).min().unwrap();
		let last_date = fri.iter().map(|day| day.date ).max().unwrap();
		fri.retain(|day| day.pupils || day.afterschool == Some(true) );
		Skole {
			navn: name,
			rute: Some(SkoleRute {
				har_sfo: has_afterschool,
				har_laerer: has_teachers,
				gjelder_fra: first_date,
				gjelder_til: last_date,
				fri: fri,
				fra_fil: file.clone(),
			}),
			om: None,
		}
	}).map(|school| {
		(school.navn.to_lowercase(), school)
	}).collect()
}

fn stavanger_ruter(content: String, path: &Path)
-> Result<HashMap<String,Skole>, String> {
	match content.lines().next().map(|header| header.to_lowercase() ) {
		None => abort!("{:?} er tom", path),
		Some(header) => {
			if header != "\u{feff}dato,skole,elevdag,laererdag,sfodag,kommentar" {
				return Err(content);
			}
		},
	}
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

	let mut schools = HashMap::<&str,Vec<Fri>>::new();
	for row in rows {
		schools.entry(row.school)
		       .or_insert_with(|| Vec::new() )
		       .push(Fri {
		            date: row.date,
		            pupils: !row.pupils,
		            teachers: Some(!row.teachers),
		            afterschool: Some(!row.afterschool),
		            comment: row.comment,
		        });
	}

	let schools = schools.into_iter().map(|(name, mut fri)| {
		let has_afterschool = fri.iter().any(|day| day.afterschool == Some(false) );
		if !has_afterschool {
			for day in &mut fri {
				day.afterschool = None;
			}
		}
		(name, has_afterschool, fri)
	});
	return Ok(to_school(schools, true, path));
}


fn gjesdal_ruter(content: String, path: &Path)
-> Result<HashMap<String,Skole>, String> {
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

	let mut schools = HashMap::<&str,Vec<Fri>>::new();
	for row in rows {
		schools.entry(row.school)
		       .or_insert_with(|| Vec::new() )
		       .push(Fri {
		            date: row.date,
		            pupils: !row.pupils,
		            teachers: None,
		            afterschool: row.afterschool.map(|yes| !yes ),
		            comment: row.comment,
		        });
	}

	let schools = schools.into_iter().map(|(name,fri)| {
		let has_afterschool = fri.first().unwrap().afterschool.is_some();
		(name, has_afterschool, fri)
	});
	return Ok(to_school(schools, false, path));
}
