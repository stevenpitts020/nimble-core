# Migrations

The [knex](http://knexjs.org/#Migrations) is used to connect to the database and to create a new migration is:

    $ knex migrate:make migration_name

Use the following conventions for migration names:
  action: create, alter, drop
  object abbreviation: t (table), v (view)
  modifier: create, drop

To create and drop of objects:

    <action>_<object_abbreviation>_<object_name>

Example:

    knex migrate:make create_t_users

When altering objects mention the changes when not too many other wise use generic alter.

    alter_<object_abbreviation>_<object_name>_<modifier>_<names>

Example:

    # To create a column
    knex migrate:make alter_t_users_add_name
    # To drop a column
    knex migrate:make alter_t_users_drop_name
    # To execute several generic changes 
    knex migrate:make alter_t_users
