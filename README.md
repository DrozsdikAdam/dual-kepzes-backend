# Duális Képzés Backend API

Ez a repository tartalmazza a Duális Képzés rendszer backend API-ját. Az alkalmazás Node.js környezetben, Express keretrendszerrel, TypeScript nyelven íródott, PostgreSQL adatbázist használ Prisma ORM-mel, és Zod könyvtárat a validációhoz.

# Technológiai Stack

* **Runtime:** Node.js
* **Nyelv:** TypeScript
* **Keretrendszer:** Express.js
* **Adatbázis:** PostgreSQL
* **ORM:** Prisma
* **Validáció:** Zod
* **Autentikáció:** JWT (JSON Web Token) + bcryptjs
* **Biztonság:** Helmet, Cors

# Telepítés és Konfiguráció

Kövesd az alábbi lépéseket a fejlesztői környezet beállításához.

### Repository klónozása

git clone https://github.com/DrozsdikAdam/dual-kepzes-backend

cd dual-kepzes-backend

npm install


### Szerver konfiguráció
PORT=3000

### Adatbázis kapcsolat (PostgreSQL connection string)
DATABASE_URL="postgresql://felhasznalo:jelszo@localhost:5432/adatbazis_neve?schema=public"

### Ha Supabase-t vagy tranzakciós poolert használsz (Opcionális)
DIRECT_URL="postgresql://felhasznalo:jelszo@localhost:5432/adatbazis_neve?schema=public"

### JWT Titkos kulcs (Aláíráshoz)
JWT_SECRET="ide_irj_egy_eros_titkos_kulcsot"

# Autentikáció

A rendszer robusztus regisztrációs és bejelentkezési folyamattal rendelkezik, amely szerepkörökre (Role) van bontva.

## Regisztráció (POST /api/auth/register)
A regisztráció során a rendszer adatbázis tranzakciót használ. Ez biztosítja, hogy a User (alapadatok) és a szerepkör-specifikus profil (pl. StudentProfile, CompanyEmployee) egyszerre jöjjön létre, vagy hiba esetén egyik sem.

Támogatott szerepkörök:

STUDENT: Hallgatói profil (Neptun kód, tanulmányi adatok).

MENTOR: Céges mentor (Cég ID, pozíció).

COMPANY_ADMIN: Céges adminisztrátor.

UNIVERSITY_USER: Egyetemi munkatárs.

SYSTEM_ADMIN: Rendszergazda.

Validációs szabályok (Zod):

Jelszó: Min. 12 karakter, tartalmaznia kell kisbetűt, nagybetűt, számot és speciális karaktert.

Email: Érvényes email formátum.

Hallgatók: Csak 18. életévüket betöltött személyek regisztrálhatnak.

## Regisztrációs Folyamat (POST /register)
Kérés érkezése: A kliens elküldi a regisztrációs adatokat (email, jelszó, szerepkör, profiladatok) a végpontra.

Validáció: A rendszer a Zod sémák (RegisterSchema) alapján ellenőrzi a bemenő adatokat.

Hiba ág: Ha az adatok nem felelnek meg (pl. gyenge jelszó, hiányzó mező), a szerver 400 Bad Request választ küld a hiba részleteivel.

Email ellenőrzés: A kontroller megnézi az adatbázisban, létezik-e már a megadott email cím.

Hiba ág: Ha létezik, 400-as hibát dob ("Már létezik felhasználó").

Jelszó titkosítás: A nyers jelszót a rendszer bcrypt segítségével hasheli (sózza és titkosítja).

Adatbázis Tranzakció:

Létrejön a User rekord az alapadatokkal (email, hash, role).

A role (szerepkör) alapján létrejön a specifikus profil:

STUDENT esetén: StudentProfile (születési dátum, cím, oktatási adatok).

MENTOR vagy COMPANY_ADMIN esetén: CompanyEmployee (céges adatok).

Hiba ág: Ha bármelyik lépés sikertelen, a tranzakció visszavon mindent.

Válasz: Sikeres mentés esetén 201 Created válasz érkezik.

## Bejelentkezési Folyamat (POST /login)
Kérés érkezése: A kliens elküldi az emailt és a jelszót.

Validáció: A bemeneti formátum ellenőrzése (LoginSchema).

Felhasználó keresése: Az adatbázis keresi a felhasználót email alapján.

Hiba ág: Ha nincs találat, 400-as hiba.

Jelszó összehasonlítás: A rendszer összeveti a beírt jelszót az adatbázisban tárolt hash-el.

Hiba ág: Ha nem egyezik, 400-as hiba.

Token generálás: Sikeres azonosítás esetén a rendszer generál egy JWT tokent (amely tartalmazza a userId-t és a role-t), 24 órás lejárattal.

Válasz: 200 OK válasz, amely tartalmazza a tokent és a felhasználó adatait.

## Token Ellenőrzés (Védett Végpontokhoz)
Middleware futása: Minden védett kérésnél lefut az authenticateToken middleware.

Header vizsgálat: Kiolvassa az Authorization fejlécet. Ha hiányzik, 401 Unauthorized.

Verifikálás: Ellenőrzi a JWT aláírását a titkos kulccsal (process.env.JWT_SECRET).

Hiba ág: Ha lejárt vagy érvénytelen, 403 Forbidden.

Továbbengedés: Ha érvényes, a felhasználói adatokat csatolja a kéréshez (req.user), és továbbengedi a vezérlést.