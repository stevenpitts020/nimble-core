
# Nimble Core

the api behind the nimble project.

### System Requirements

- nodejs = 14
- postgres >= 11
- [localstack](https://github.com/localstack/localstack) or an AWS account

#### Related repos

- [nimble-ops](https://gitlab.com/wearesingular/clients/nimble/nimble-ops) - infrastructure for the project
- [nimble-crm](https://gitlab.com/wearesingular/clients/nimble/nimble-crm) - CRM and backoffice
- [nimble-onboarding](https://gitlab.com/wearesingular/clients/nimble/nimble-onboarding) - Client facing frontend

### Environments

This project configures using GitLab tools for CI/CD and the environment is hosted by AWS EKS Cluster.

All application runtime logs for the environments are available through Kibana, follow this [steps](https://gitlab.com/wearesingular/clients/nimble/nimble-ops/-/blob/master/terraform/modules/observability/README.md)

#### Development

endpoint: [https://api.dev.nimblefi.com/](https://api.dev.nimblefi.com/v1/health)

#### Acceptance / Demo

endpoint: [https://api.demo.nimblefi.com/](https://api.demo.nimblefi.com/v1/health)

#### Production

endpoint: [https://api.app.nimblefi.com/](https://api.app.nimblefi.com/v1/health)

## Local Development

### Option 1 – Local Node + Docker for Postgres and LocalStack

Make sure you have the LTS node/npm versions (14 and up) `$ node -v`.

1. Launch LocalStack container
   `docker run --rm --name localstack -p 4566:4566 -p 8055:8080 -d localstack/localstack:0.12.6`

2. Seed LocalStack
   `sh scripts/localstack.sh`

3. Launch Postgres container

   ```bash
   docker run --rm --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=nimble-core-pass -e POSTGRES_USER=nimble-core-user -e POSTGRES_DB=nimble-core-db -d postgres:11-alpine

   # Create test db in docker
   docker exec -it postgres bash -c "createdb -h localhost -U nimble-core-user nimble-core-test"
   ```

   ```bash
   # Run only if you need to drop test db
   docker exec -it postgres bash -c "dropdb -h localhost -U nimble-core-user nimble-core-test"
   ```

4. Install dependencies
   `npm install`

5. Run Migrations
   `npm run migrate`

6. Seed the DB
   `npm run seed`

and run the account number script

```sql
  do $$
  declare
    strt integer:= 1; -- start in this index, excluding this number
    num integer:= 99; -- loop until this number (including)
    counter integer := 0 ; -- loop index, do not touch
    institution_id uuid := '2552ab85-08da-4bb5-be00-9e94d282d311';
  begin
    counter:=strt;
    loop
      exit when counter >= num ; -- foreach check
      counter :=  counter + 1 ; -- increment counter
      INSERT INTO product_account_numbers (institution_id, account_number) VALUES (institution_id, CONCAT('DEMO',counter));
    end loop;
  end $$;
```

7. Run app in development mode
   `npm run dev`

8. Check API is running
   Send GET request to http://localhost:8080/v1/health

9. Run tests (requires `nimble-core-test` database)
   `npm run test`

### Option 2 - Local Node & Postgres + Docker for LocalStack

If you are running postgres outside of docker you can use postgress-cli to create database and user.
**In place of step 3 from Option 1, run the following:**

```bash
# Drop existing databases if needed
$ sh scripts/dropdb.sh
```

> Or run:
> `$ dropdb nimble-core-db`
> `$ dropdb nimble-core-test`
> `$ dropuser nimble-core-user`

```bash
# Create & initialize database
$ sh scripts/initdb.sh
```

> Or run:
> `$ createuser nimble-core-user -D -s`
> `$ createdb nimble-core-db -O nimble-core-user`
> `$ createdb nimble-core-test -O nimble-core-user`

## Localstack

[Localstack](https://github.com/localstack/localstack) is an AWS "emulator" for localhost that exposes a copy the AWS services on diferent ports on your local machine. For example, S3 will be located at http://localhost:4572
After launching localstack, use the following script to set it up:

```bash
$ sh scripts/localstack.sh
```

## Enable MFA

To enable MFA in development configure the following environment variables:
```
export TWILIO_SERVICE_SID=<secret1>
export TWILIO_ACCOUNT_SID=<secret2>
export TWILIO_AUTH_TOKEN=<secret3>
```

The values are available in Twilio dashboard ("Verify" service).

## Cronjobs

Cronjobs are configured to execute the `worker.js` content, to run locally you can run:

```bash
npm run dev-worker
```

## Running the API & other tasks

```bash
# runing development mode
npm run dev
```

```bash
# runing in watch mode
npm run watch
```

#### Testing

```bash
# linting the code before pushing
npm run lint
```

```bash
# running tests
npm run test
```

```bash
# running test coverage checks
npm run test:coverage
```

#### Testing email templates

because AWS does not give feedback when we send emails with parse errors, we have a script to test the email rendering. to run the script run the following command with your AWS credentials:

```bash
# running email tests
AWS_ACCESS_KEY_ID=[***] AWS_ACCESS_KEY_SECRET=[***] node scripts/test_email_templates.js | bunyan
```
#### Migrations

```bash
# applying migrations
npm run migrate
```

```bash
# rolling back migrations
npm run rollback
```

```bash
# creating a migration
npm run migrate:create %name%
```

running `$ npm start` will start the application without an `NODE_ENV` assumption

## Production/Developement Seed data
- list of products with options: https://lassos.atlassian.net/wiki/spaces/LAS/pages/749568001/Product+data
- script to generate available account_numbers: https://lassos.atlassian.net/wiki/spaces/LAS/pages/783319041/Product+Account+Numbers

## Changing the Config

by default, `$ npm run dev` will load `config/local.js` where local development config overwrites live. `config/test.js` will be used when running test. production configs are stored in environment variables as described in `config/schema.js`

## API Documentation

The API documentation is specified using [Swagger 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md)

> Swagger™ is a project used to describe and document RESTful APIs.

> The Swagger specification defines a set of files required to describe such an API. These files can then be used by the Swagger-UI project to display the API and Swagger-Codegen to generate clients in various languages. Additional utilities can also take advantage of the resulting files, such as testing tools.

The API documentation is defined in the file `docs/spec.yaml` and available 'http://localhost:8080/'.

## External Services

- Docusign: Refer to /services/docusign_template/notes.md
- Credit Bureau: Refer to /services/credit_report/notes.md

## Converting HTML to PDF

we are using a lambda function to convert html to pdf (https://github.com/zeplin/zeplin-html-to-pdf). this function is running for each env.
to Update/create new lambdas follow the steps bellow:
1) create a new function, with at least 30 secs timeout and 1024 RAM
2) Add the following env var: `FONTCONFIG_PATH=/var/task/fonts`
3) pull from https://github.com/zeplin/zeplin-html-to-pdf
4) run `$ npm run pack && aws lambda update-function-code --region us-east-2 --function-name [FUNCTION_NAME_HERE] --zip-file fileb://`pwd`/package.zip`
