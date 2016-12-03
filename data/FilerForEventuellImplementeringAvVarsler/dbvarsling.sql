start transaction;
create schema if not exists skolerutevarsling;
use skolerutevarsling;

drop table if exists skole;
drop table if exists varsling;

create table skole (
	ID smallint unsigned not null auto_increment,
    navn varchar(255) not null,
    primary key (ID)
) engine InnoDB default charset utf8;

create table varsling (
	epost varchar(255) not null, 
    skoleID smallint unsigned not null,
    primary key (epost,skoleID),
    foreign key (skoleID) references skole(ID)
) engine InnoDB default charset utf8;

commit;