create table categories (
  category_id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY, 
	category_name VARCHAR(8)
);
insert into categories (category_name) values ('Software');
insert into categories (category_name) values ('Food');
insert into categories (category_name) values ('Travel');
insert into categories (category_name) values ('Science');
insert into categories (category_name) values ('Etc.');
