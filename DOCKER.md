# Docker hasznalat

Ez a projekt kapott egy egyszeru, azonnal hasznalhato Docker indulast, ami a meglevo kulso szolgaltatasokra tamaszkodik.

- PostgreSQL: a jelenlegi `.env` alapjan kulso kapcsolat
- Redis: opcionalis, csak akkor kell, ha kulon beallitod
- SMTP / S3: marad a meglevo `.env` alapjan

Inditas:

```bash
docker compose up -d --build
```

Leallitas:

```bash
docker compose down
```

Indulaskor a kontener automatikusan lefuttatja a Prisma migraciokat (`prisma migrate deploy`), majd elinditja a backendet.

Megjegyzesek:

- a `.env` fajl nincs beepitve az image-be, a compose futaskor adja at
- az `uploads` mappa volume-kent csatolva van, igy a tartalma koltozesnel is megmarad
- ha nem hasznalsz Redis-t, hagyd `REDIS_ENABLED=false` erteken vagy ne adj meg Redis kapcsolatot
