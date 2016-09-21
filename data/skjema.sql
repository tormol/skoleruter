start transaction;
create schema if not exists skoleruter;
use skoleruter;

drop view if exists sum_fri;
drop table if exists fri;
drop table if exists skole;

-- har også SFOer
create table skole (
	ID smallint unsigned not null auto_increment,
	navn varchar(255) not null,-- for SFOer erstattes " skole" med " sfo"
	adresse varchar(1000) not null,
	nettside varchar(1000) not null,
	telefon char(8) charset ascii,
	posisjon point not null,
	data_gyldig_til date not null,
	sist_oppdatert date not null,
	sfo smallint unsigned,-- er null hvis skolen ikke har SFO.
	                      -- skal den være null eller lik ID for SFOer?

	primary key (ID),
	unique key unik_id (ID),
	unique key unik_navn (navn),
	fulltext index search (navn, adresse),
	spatial index (posisjon),
	constraint foreign key (sfo) references skole (ID) on delete cascade
) engine InnoDB default charset utf8;

-- inneholder ikke helger eller Juli.
-- datoer alle har fri slås ikke sammen.
create table fri (
	skoleID smallint unsigned not null,
	dato date not null,
	ikke_for_ansatte tinyint(1) not null,
	grunn varchar(255) not null,

	primary key (skoleID,dato),
	unique key unik_fri (skoleID,dato),
	constraint foreign key (skoleID) references skole (ID) on delete cascade
) engine InnoDB default charset utf8;

create view sum_fri as
	select dato,COUNT(dato) as antall from fri group by dato;

commit;
