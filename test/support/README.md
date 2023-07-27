# Seeds

The seeds are used to insert database data for tests.
The file should be snake case and plural.

Support:

    seed.entity.create() // create all
    seed.entity.create(1) // create by id
    seed.entity.create({}) // create by object
    seed.entity.create([]) // create by collection
    seed.entity.get() // get first
    seed.entity.get(1) // get by id

If you add a file for a new table, don't forget to edit the seeds.js file
to add an entry in the list of flush commands if needed, example:

```
 DELETE FROM signer_credit_reports CASCADE;
```

## Running in development

If you want to run these seeds in your local database,
you must add the seed name to the list in /seeds/dev.js and
run the following command each time you want to populate the db:

```bash
# runing development mode
npm run dev
```

# Blueprints

The blueprints are used to mock expected results returned from API.

Example:

  blueprints.institution.get('singular')
