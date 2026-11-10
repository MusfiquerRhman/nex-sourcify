# Sourcify testing and training instance

The testing stack uses Compose project `nex-sourcify-testing`, a private Docker network, separate PostgreSQL/Redis/upload volumes, its own signing secret, and port **8000**. PostgreSQL and Redis have no published ports. The automation worker connects only to the testing database and Redis.

Set the three random secrets from `testing.env.example` in a private `.env` beside `docker-compose.testing.yml`, then run:

```sh
docker compose -f docker-compose.testing.yml config --quiet
docker compose -f docker-compose.testing.yml build setup app
docker compose -f docker-compose.testing.yml up -d
docker compose -f docker-compose.testing.yml ps -a
```

The setup container creates the schema from the current Prisma schema and seeds application modules, departments, TT/LC payment types, Level 1 through Level 5 and user `trainingadmin`. The training administrator uses Level 5 with full permissions. It does not copy live business data or user accounts. The administrator password comes from `TEST_ADMIN_PASSWORD`. Setup preserves existing training data on subsequent starts and keeps the five level names consistent with the original server; it is not a schema migration tool.

For a fresh deployment, verify login, permissions and the automation pipeline with the command below. It creates one temporary country, waits for the worker to write its history, then removes the verification records. Run this before trainees begin entering data.

```sh
docker compose -f docker-compose.testing.yml run --rm --no-deps setup node deploy/testing/verify.mjs
```

`APP_ENV=testing` enables the amber **TESTING SERVER** label in the authenticated top bar and on the sign-in screen. The normal production configuration does not enable this flag.

On Hostinger the stack lives at `/docker/nex-sourcify-testing` and can be reached at `http://200.234.33.89:8000`. Run the commands above from that directory. This deployment does not replace the production project at `/docker/nex-sourcify`.
