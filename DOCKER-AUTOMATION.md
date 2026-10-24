# Local automation connection

Nexus uses the existing Docker Redis instance and the automation worker shares the Nexus database. Credentials are stored in ignored `.env` files.

- Local Nexus: Redis at `127.0.0.1:6379`.
- Docker worker and Docker Nexus: Redis at `redis:6379`, network `nexus-network`.
- Worker container: `RDL_NEXUS_WORKER`.

From the Nexus directory, preserve the localhost port mapping when restarting Redis:

```powershell
docker compose -p redis -f ../redis/docker-compose.yml -f docker-compose.redis-host.yml up -d redis
```

From `../autometion/nexus-automation`, start or rebuild the worker:

```powershell
docker compose up -d --build worker
```

Inspect the worker with `docker logs --tail 50 RDL_NEXUS_WORKER`. Restart Nexus after environment changes. Redis data remains in the existing `redis_redis-data` volume.
