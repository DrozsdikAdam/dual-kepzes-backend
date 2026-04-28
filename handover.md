# Duális Képzés Backend Handover

> Utolsó frissítés: 2026-04-28
> Állapot: aktívan fejlesztett, funkcionálisan széles backend

## 1. Cél és kontextus

Ez a repository a duális képzési rendszer backend API-ja. A rendszer fő szereplői:

- hallgatók
- céges adminok és mentorok
- egyetemi referensek
- rendszeradminisztrátorok

A backend feladata:

- felhasználói és szerepkör-specifikus működés kiszolgálása
- cégek, pozíciók, jelentkezések és partnerségek kezelése
- értesítések, hírek, tananyagok és statisztikák biztosítása
- adminisztratív és auditálható működés támogatása

## 2. Rövid rendszerkép

Technológiai alapok:

- **[Node.js](https://nodejs.org/)**: eseményvezérelt szerveroldali futtatókörnyezet az API kiszolgálásához
- **[TypeScript](https://www.typescriptlang.org/)**: statikus típusosság a kontrollerektől a service rétegig
- **[Express](https://expressjs.com/)**: könnyű, jól kontrollálható HTTP keretrendszer, itt Express 5 alapokon
- **[Prisma](https://www.prisma.io/)**: típusos adat-hozzáférési réteg és sémakezelés PostgreSQL fölött
- **[PostgreSQL](https://www.postgresql.org/)**: relációs adatbázis a domain entitások és kapcsolatok tárolására
- **[Zod](https://zod.dev/)**: request validáció és input normalizálás
- **[JWT](https://jwt.io/)**: token alapú autentikáció és role-based hozzáférés
- **[BullMQ](https://docs.bullmq.io/)**: háttérfolyamatok és queue alapú feldolgozás
- **[Redis](https://redis.io/)**: queue backend és később többpéldányos koordináció lehetséges alapja
- **[Nodemailer](https://nodemailer.com/)**: SMTP alapú emailküldési integráció
- **[Swagger / OpenAPI](https://swagger.io/)**: interaktív API dokumentáció és szerződéskövetés

Fő rétegek:

- `routes`: endpoint wiring és middleware lánc
- `controllers`: HTTP szintű kezelés
- `services`: üzleti logika
- `schemas`: input validáció
- `middlewares`: auth, validation, ownership, rate limiting, error handling
- `config`: Prisma, Swagger, Redis, mailer, CORS
- `utils`: mapperek, auth helper-ek, pagination, egyéb közös logika

## 3. Fontos belépési pontok

- [src/server.ts](D:/coding/dual-kepzes-backend/src/server.ts:1): szerverindítás
- [src/app.ts](D:/coding/dual-kepzes-backend/src/app.ts:1): middleware-ek, route-ok, error handler
- [prisma/schema.prisma](D:/coding/dual-kepzes-backend/prisma/schema.prisma:1): adatmodell
- [src/config/prisma.ts](D:/coding/dual-kepzes-backend/src/config/prisma.ts:1): Prisma kliens és soft delete viselkedés
- [src/config/swagger.ts](D:/coding/dual-kepzes-backend/src/config/swagger.ts:1): OpenAPI alapkomponensek
- [README.md](D:/coding/dual-kepzes-backend/README.md:1): technikai és folyamatdokumentáció

## 4. Futtatás és fejlesztői workflow

Alap parancsok:

```bash
npm install
npm run dev
npm run build
npm test
npm run lint
npm run prisma:push
npm run prisma:studio
npx prisma db seed
```

Megjegyzés:

- ebben a környezetben az `npm` lokális futtatása hibába futott egy hiányzó `npm-cli.js` miatt, ezért automatizált ellenőrzést most nem tudtam végigfuttatni
- a repo dokumentációja és route kommentjei ennek ellenére kézzel szinkronizálva lettek a jelenlegi kóddal

## 5. Környezeti változók és konfigurációs döntések

Jelenlegi fejlesztői adatbázis-konvenció:

- a Prisma kapcsolat jelenleg `DIRECT_URL` alapján van konfigurálva
- ez tudatos, a most használt adatbázis-hozzáféréshez igazított működés

Tervezett production irány:

- éles környezetben a cél a `DATABASE_URL` alapú kapcsolat
- ezt majd a deploy környezettel és Prisma konfigurációval együtt kell véglegesíteni

Jellemző `.env` mezők:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=replace-with-a-strong-secret
FRONTEND_URL=http://localhost:3000

DIRECT_URL=postgresql://user:password@localhost:5432/dual_db?schema=public

REDIS_ENABLED=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

EMAILS_ENABLED=false
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

Kritikus megjegyzések:

- a `JWT_SECRET` most már kötelező, nincs fallback secret
- az email küldés jelenleg tudatosan kikapcsolható, mert a végleges SMTP még nincs készen
- az idempotency middleware memória alapú, ami egy példányos futtatásnál rendben van, több példányos deploynál viszont nem elég

## 6. Adatmodell és domain összefoglaló

Legfontosabb entitások:

- `User`
- `StudentProfile`
- `Company`
- `CompanyEmployee`
- `Major`
- `Location`
- `Position`
- `Application`
- `DualPartnership`
- `Notification`
- `News`
- `MaterialCompletion`
- `GalleryGroup`
- `GalleryImage`
- `CompanyImage`

Fontos enumok:

- `Role`
- `ApplicationStatus`
- `PartnershipStatus`
- `RegistrationStatus`
- `PositionType`

Kulcs domain-kapcsolatok:

- `User` -> `StudentProfile` vagy `CompanyEmployee`
- `StudentProfile` -> `Application`, `DualPartnership`, `MaterialCompletion`
- `Company` -> `CompanyEmployee`, `Position`, `Location`, `CompanyImage`
- `Position` -> `Application`, `DualPartnership`, `Tag`, `Location`
- `User` <-> `Major`, `Company` referensi hozzárendeléseken keresztül

## 7. Soft delete stratégia

Soft delete érintett modellek:

- `User`
- `StudentProfile`
- `CompanyEmployee`
- `Company`
- `Position`
- `Tag`
- `Application`
- `DualPartnership`
- `News`
- `Notification`

Aktuális működés:

- `findMany` és `findFirst` automatikusan szűri a `deletedAt = null` rekordokat
- `findUnique` most már nem kerül át kézzel `findFirst`-re
- `findUnique` előbb normál módon lekérdez, és utólag nullázza a soft-deletelt rekordot

Miért fontos:

- ez közelebb van a natív Prisma-szemantikához
- kisebb a tranzakciós és implicit viselkedési kockázat

## 8. Auth és jogosultsági modell

Szerepkörök:

- `STUDENT`
- `MENTOR`
- `COMPANY_ADMIN`
- `UNIVERSITY_USER`
- `SYSTEM_ADMIN`

Fő auth middleware-ek:

- [src/middlewares/auth.middleware.ts](D:/coding/dual-kepzes-backend/src/middlewares/auth.middleware.ts:1)
- [src/middlewares/ownership.middleware.ts](D:/coding/dual-kepzes-backend/src/middlewares/ownership.middleware.ts:1)

Fő döntések:

- JWT alapú auth
- role alapú route-védelem
- ownership ellenőrzés bizonyos company, notification, partnership és application műveleteknél
- auth hibák most már a központi error handleren mennek át

Fontos auth üzleti szabályok:

- inaktív user nem léphet be
- törölt user nem léphet be
- céges user login blokkolható a cég `PENDING` vagy `REJECTED` státusza miatt

## 9. Validáció és hibakezelés

Fő fájlok:

- [src/middlewares/validate.middleware.ts](D:/coding/dual-kepzes-backend/src/middlewares/validate.middleware.ts:1)
- [src/middlewares/error.middleware.ts](D:/coding/dual-kepzes-backend/src/middlewares/error.middleware.ts:1)
- [src/errors/AppError.ts](D:/coding/dual-kepzes-backend/src/errors/AppError.ts:1)

Friss állapot:

- a validációs middleware a validált `body`, `query` és `params` adatokat is visszaírja a requestbe
- a Zod hibák `ValidationError` formában kerülnek a központi handlerbe
- auth middleware közvetlen JSON helyett szintén a központi handlerre támaszkodik

Miért fontos:

- egységesebb API hibaformátum
- egyszerűbb frontend oldali kezelés

## 10. Fontos üzleti folyamatok

### 10.1 Jelentkezés

Belépési pontok:

- `POST /api/applications`
- `POST /api/applications/submit-with-files`

Fő szabályok:

- csak hallgatói profillal lehet jelentkezni
- egy hallgató egy pozícióra egyszer jelentkezhet
- inaktív vagy nem létező pozícióra nem lehet jelentkezni

### 10.2 Jelentkezés értékelése

Kulcs logika:

- céges oldalról `ACCEPTED`, `REJECTED`, `NO_RESPONSE`
- státuszváltás a `status-transition` util alapján validált

Belépési pont:

- `PATCH /api/applications/company/:id/evaluate`

### 10.3 Jelentkezésből partnerség

Ha egy jelentkezés `ACCEPTED` lesz:

- létrejön egy `DualPartnership`
- a kezdeti státusz `PENDING_MENTOR`
- ha van megfelelő referens, a rendszer megpróbálja automatikusan hozzárendelni

### 10.4 Referensi logika

Fontos service:

- [src/services/universityUser.service.ts](D:/coding/dual-kepzes-backend/src/services/universityUser.service.ts:1)

Aktuális működés:

- a rendszer a hallgató szakja és a pozíció cége alapján keres referenst
- a referens manuálisan is cserélhető
- van dedikált referens-overview stat endpoint

### 10.5 Fájlos jelentkezés

Kulcs route:

- `POST /api/applications/submit-with-files`

Megjegyzések:

- a fájlok memória bufferben maradnak
- nincs lokális lemezpersistálás
- a dokumentumok háttérben mennek ki emailben a cég felé
- az application létrehozása és az email kiküldés nem egy tranzakciós egység

Ez utóbbi fontos ismert kompromisszum:

- ha az email elbukik, a jelentkezés akkor is létrejöhet

## 11. Email, queue és háttérfolyamatok

Fő fájlok:

- [src/config/mailer.ts](D:/coding/dual-kepzes-backend/src/config/mailer.ts:1)
- [src/config/redis.ts](D:/coding/dual-kepzes-backend/src/config/redis.ts:1)
- [src/services/email.queue.ts](D:/coding/dual-kepzes-backend/src/services/email.queue.ts:1)
- [src/services/email.worker.ts](D:/coding/dual-kepzes-backend/src/services/email.worker.ts:1)

Jelenlegi állapot:

- email küldés infrastruktúra-függően mockolható
- Redis hiányában a queue nem aktív
- ez jelenleg tudatos, nem rejtett hiba

Átadási megjegyzés:

- amikor megérkezik a végleges SMTP, érdemes külön smoke testet írni az email és queue flow-ra

## 12. Galéria és képfeltöltés

Fő elemek:

- `GalleryGroup`
- `GalleryImage`
- `CompanyImage`

Megoldás:

- S3 / Supabase alapú tárolás
- képoptimalizálás Sharp-pal
- rendszer- és cégszintű galériák külön kezelve

## 13. Statisztikák

Fő stat endpointok:

- `GET /api/stats`
- `GET /api/stats/company/me`
- `GET /api/stats/applications`
- `GET /api/stats/partnerships`
- `GET /api/stats/positions`
- `GET /api/stats/trends`
- `GET /api/stats/university/student-distribution`
- `GET /api/stats/university/referent-overview`

Megjegyzés:

- a stat service több helyen több lekérdezést aggregál
- teljesítményhangolásnál ezt érdemes elsőként profilozni

## 14. Dokumentáció állapota

Frissítve lett:

- [README.md](D:/coding/dual-kepzes-backend/README.md:1)
- Swagger route kommentek több route fájlban
- [src/config/swagger.ts](D:/coding/dual-kepzes-backend/src/config/swagger.ts:1)

Jelenlegi dokumentációs erősségek:

- a README tartalmaz architektúra- és folyamatdiagramokat
- az ER diagram a jelenlegi schema alapján lett frissítve
- a Swagger több kulcs endpointnál szinkronizálva lett a sémákkal

Maradék kockázat:

- a repo több fájljában korábban sérült karakterkódolás volt
- emiatt később is érdemes figyelni rá, hogy UTF-8-ban maradjanak a dokumentációs fájlok

## 15. Ismert technikai kockázatok és kompromisszumok

1. Az idempotency middleware memória alapú.
   Több példányos deploynál központi store kell.

2. A fájlos jelentkezés nem garantálja ugyanabban a műveleti egységben az application + email sikerét.
   Üzletileg elfogadott lehet, de fontos tudni róla.

3. A Prisma datasource jelenleg `DIRECT_URL`-re épít.
   Production környezetben ezt át kell vezetni a végleges stratégiára.

4. A soft delete viselkedés központilag ki van terjesztve.
   Nyers, teljes rekordhozzáféréshez külön figyelem kell.

5. A teszt- és lintkör most ebben a környezetben nem futott le `npm` probléma miatt.
   Érdemes ezt külön elsőként helyrehozni.

## 16. Javasolt első lépések az átvevő fejlesztőnek

1. Ellenőrizze a helyi `npm` és futtatási környezetet.
2. Indítsa el a projektet fejlesztői módban.
3. Nézze át a Swagger UI-t és a fő auth/application/company flow-kat.
4. Validálja a tényleges adatbázis-konfigurációs stratégiát fejlesztői és éles környezetben.
5. Egyeztesse az email infrastruktúra és Redis tervet deployment oldalról.

## 17. Javasolt következő technikai fókuszok

- end-to-end tesztkör stabilizálása
- email és queue flow élesítése
- soft delete stratégia további egyszerűsítése, ha szükséges
- többpéldányos deployment esetére idempotency újragondolása
- dokumentáció és Swagger folyamatos szinkronban tartása

## 18. Hasznos fájlok az átadáshoz

- [README.md](D:/coding/dual-kepzes-backend/README.md:1)
- [handover.md](D:/coding/dual-kepzes-backend/handover.md:1)
- [package.json](D:/coding/dual-kepzes-backend/package.json:1)
- [prisma/schema.prisma](D:/coding/dual-kepzes-backend/prisma/schema.prisma:1)
- [src/app.ts](D:/coding/dual-kepzes-backend/src/app.ts:1)
- [src/config/prisma.ts](D:/coding/dual-kepzes-backend/src/config/prisma.ts:1)
- [src/routes](D:/coding/dual-kepzes-backend/src/routes)
- [src/services](D:/coding/dual-kepzes-backend/src/services)
- [user_guides](D:/coding/dual-kepzes-backend/user_guides)

## 19. Rövid átadási összefoglaló

Az átadás szempontjából a legfontosabb tudnivalók:

- a jelenlegi fejlesztői DB stratégia `DIRECT_URL`
- az email infrastruktúra még nem végleges
- az idempotency jelenleg memória alapú
- a soft delete viselkedés központilag kezelt
