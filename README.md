# RDL NEXUS
RDL NEXUS is build with the [T3 stack](https://create.t3.gg/en/introduction), guaranteeing type safety from start to finish.

## Tech Stack
- Language: [TypeScript](https://www.typescriptlang.org/docs/handbook/intro.html)
- Framework: [NextJS](https://nextjs.org/docs)
- Async State Management: [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview) 
- Non-Async State Management: [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction)
- API: [tRPC](https://trpc.io/docs)
- ORM: [Prisma](https://www.prisma.io/docs/getting-started/prisma-orm/add-to-existing-project/postgresql)
- Database: [PostgreSQL](https://www.postgresql.org/docs/18/index.html)
- UI: [Tailwind CSS](https://tailwindcss.com/docs/installation/using-vite)
---

## Interface Design Systems
This code follows the [Atomic Design Methodology](https://atomicdesign.bradfrost.com/chapter-2/). Follow the article for details.

---

## Useful  Commands
### Server
##### SSH to the server
```bash
ssh rdlerpadmin@192.168.21.253 -p 60011
```

###### Login to psql
```bash
docker exec -it postgres_db psql -U musfiq -d nexus_db
```

### App
##### Run Dev Build
```bash
npm run dev
```
##### Production Build
```bash
npm run build
```

##### Run Production Build
```bash
npm start
```

### Database
##### Generate Prisma Schema from DB
```bash
npx prisma db pull
```
##### Generate Prisma Client
```bash
npx prisma generate
```

> In Case Windows or any other process is restricting Prisma generate
>
> >`
>    taskkill /F /IM node.exe
> `
> >`
>    taskkill /F /IM code.exe
> `
>
> This will kill the node and code processes

### Docker
##### Build Docker Container
```bash
docker build -t nexus .
```

##### Run Docker Container
```bash
docker run -itd -p 3000:3000 --restart unless-stopped nexus
```

##### If Docker facing DNS issue
```bash
docker build --network="host" -t nexus
```

##### Build Docker without using cache
```bash
docker build --no-cache -t nexus
```

#### Remove Container

```bash
docker rm <container_name>
```

#### Check Stopped Containers

```bash
docker ps -a
```

---

## Data Backup
```bash
 \! pg_dump -U musfiq -d nexus_db -f "E:\Downloads\schema.sql"
```

---

## **Linux Permissions**

#### Read + Write

```bash
sudo chmod -R a+rw /var/rdl-erp/backend/db_backup
```

#### Read + Write + Execute

```bash
sudo chmod -R a+rwx /var/rdl-erp/backend/db_backup
```

---

## **Storage Management**

#### Check Server Storage Details:

```bash
df -h
```

#### Check Docker Storage Details

```bash
docker system df
```

#### Remove all stopped containers

```bash
docker container prune
```

#### Remove build cache

```bash
docker builder prune
```

#### Remove unused images (doesn’t delete ones in use)

```bash
docker image prune
```

#### One-shot cleanup for all reclaimable space:

```bash
docker system prune -a --volumes
```

> ⚠️ This will delete:
>
> - All stopped containers
> - All unused images
> - All unused networks
> - All unused volumes
> - Build cache

#### Run Docker Test Server
```bash
docker-compose up --build -d

docker compose down
docker compose build --no-cache
docker compose up -d


docker build -t nexus .

docker run -p 7000:7000 -e DATABASE_URL="postgresql://musfiq:Musfiquer%263468%23%23@192.168.33.4:5432/nexus_db" -e SHADOW_DATABASE_URL="postgresql://musfiq:Musfiquer%263468%23%23@192.168.33.4:5432/nexus_db" -e JWT_SECRET="xU7i7z9U4y8oVLSe0Pti00k9o2fb0phPWQuf4Dx8RumEC0K7lZOyCDUEHy6WubkS" nexus 
```
