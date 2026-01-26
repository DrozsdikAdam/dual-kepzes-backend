# Duális Képzés Backend API

Ez a repository a Duális Képzés rendszer backend szolgáltatását tartalmazza. Az alkalmazás célja a hallgatók, cégek, egyetemi szereplők és a duális képzés adminisztrációjának támogatása egy robusztus, biztonságos és skálázható REST API-n keresztül.

## 🛠 Technológia Stack

A projekt modern, iparági sztenderd technológiákra épül:

-   **Runtime**: [Node.js](https://nodejs.org/) (v18+) - Skálázható, eseményvezérelt futtatókörnyezet a szerveroldali logika végrehajtásához.
-   **Nyelv**: [TypeScript](https://www.typescriptlang.org/) - A JavaScript típusbiztos felülhalmaza, amely növeli a kód megbízhatóságát és karbantarthatóságát.
-   **Keretrendszer**: [Express](https://expressjs.com/) - Minimalista webes keretrendszer a REST API végpontok és a HTTP kérések hatékony kezelésére.
-   **Adatbázis**: [PostgreSQL](https://www.postgresql.org/) - Megbízható, nyílt forráskódú relációs adatbázis-kezelő a strukturált adatok tárolására.
-   **ORM**: [Prisma](https://www.prisma.io/) - Modern adatbázis-hozzáférési réteg, amely egyszerűsíti az adatmodellezést és a lekérdezéseket.
-   **Validáció**: [Zod](https://zod.dev/) - TypeScript-first séma deklarációs és validációs könyvtár a bejövő adatok ellenőrzésére.
-   **Autentikáció**: JSON Web Token (JWT) + Bcrypt - Biztonságos token alapú azonosítás és jelszóhashelés a felhasználói fiókok védelmére.
-   **Háttérfolyamatok**: [BullMQ](https://docs.bullmq.io/) (Redis alapú queue) - Nagy teljesítményű üzenetsor-kezelő az aszinkron feladatok és háttérműveletek megbízható végrehajtásához.
-   **Email**: Nodemailer (SMTP) - Moduláris email küldő szolgáltatás a rendszerüzenetek és értesítések kézbesítésére.

## 🚀 Előfeltételek

A fejlesztői környezet futtatásához szükséges szoftverek:

*   **Node.js**: Legalább v18.x verzió.
*   **npm**: Csomagkezelő (általában a Node.js része).
*   **PostgreSQL**: Helyi adatbázis szerver vagy Docker konténer.
*   **Redis**: Opcionális, de ajánlott a háttérfolyamatokhoz (BullMQ).

## 📥 Telepítés és Indítás

1.  **Repository klónozása**
    ```bash
    git clone https://github.com/DrozsdikAdam/dual-kepzes-backend.git
    cd dual-kepzes-backend
    ```

2.  **Függőségek telepítése**
    ```bash
    npm install
    ```

3.  **Környezeti változók beállítása**
    Másold a példa konfigurációt (vagy hozd létre manuálisan) egy `.env` fájlba a gyökérkönyvtárban:
    
    ```env
    # Szerver
    PORT=3000
    NODE_ENV="development"

    # Adatbázis
    DATABASE_URL="postgresql://user:password@localhost:5432/dual_db?schema=public"
    # Ha szükséges (pl. Supabase): DIRECT_URL="..."

    # Biztonság
    JWT_SECRET="szuper_titkos_kulcs_min_32_karakter"

    # Email (Mailtrap példa)
    MAILTRAP_USER="your_user"
    MAILTRAP_PASS="your_pass"

    # Redis (Opcionális, BullMQ-hoz)
    REDIS_HOST="localhost"
    REDIS_PORT=6379
    ```

4.  **Adatbázis szinkronizáció**
    Hozd létre a táblákat a Prisma séma alapján:
    ```bash
    npm run prisma:push
    ```

5.  **Szerver indítása (Fejlesztői mód)**
    ```bash
    npm run dev
    ```
    A szerver elindul a `http://localhost:3000` címen.

## 📜 Elérhető Szkriptek

A `package.json`-ben definiált főbb parancsok:

| Parancs | Leírás |
| :--- | :--- |
| `npm run dev` | Fejlesztői szerver indítása watch módban (`nodemon` + `tsx`). |
| `npm start` | A lefordított (`dist`) kód futtatása éles környezetben. |
| `npm run build` | TypeScript kód fordítása JavaScriptre a `dist` mappába. |
| `npm run prisma:push` | Adatbázis séma szinkronizálása a `schema.prisma` alapján (fejlesztéshez). |
| `npm run prisma:format` | Prisma fájlok formázása. |
| `npm run prisma:studio` | Adatbázis GUI megnyitása a böngészőben. |
| `npx prisma db seed` | Adatbázis feltöltése tesztadatokkal (`prisma/seed.ts`). |

## 🏗 Projekt Struktúra

```
src/
├── config/         # App konfigurációk (DB, Redis, Email)
├── controllers/    # Üzleti logika (Request/Response kezelés)
├── middlewares/    # Express middleware-ek (Auth, Validáció, RateLimit)
├── routes/         # API végpontok definíciói
├── schemas/        # Zod validációs definíciók
├── services/       # Komplex üzleti logika (opcionális réteg)
├── utils/          # Segédfüggvények (Logger, Token, Mapper)
└── app.ts          # Express App inicializálás
prisma/
├── schema.prisma   # Adatbázis modellek
└── seed.ts         # Kezdeti adatfeltöltő szkript
```

## 🔌 API Dokumentáció

Minden végpont a `/api` prefix alatt érhető el. A legtöbb végponthoz érvényes `Authorization: Bearer <token>` fejléc szükséges.

### 🔐 Autentikáció (`/api/auth`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `POST` | `/register` | Új felhasználó regisztrációja. |
| `POST` | `/login` | Bejelentkezés és JWT token igénylése. |

### 👤 Hallgatók (`/api/students`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Összes hallgató listázása. |
| `GET` | `/me` | Saját hallgatói profil lekérése. |
| `PATCH` | `/me` | Saját profil frissítése. |
| `DELETE` | `/me` | Saját profil törlése. |
| `GET` | `/:id` | Hallgató lekérése ID alapján. |
| `PATCH` | `/:id` | Hallgató módosítása (Admin). |
| `DELETE` | `/:id` | Hallgató törlése (Soft delete). |

### 🏢 Cégek (`/api/companies`)

A cégek kezelése, beleértve a státuszkezelést és a munkavállalókat.

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Aktív cégek listázása. |
| `POST` | `/` | Új cég létrehozása. |
| `GET` | `/inactive` | Inaktív cégek listázása. |
| `GET` | `/:id` | Cég részletei. |
| `PATCH` | `/:id` | Cég adatainak frissítése. |
| `DELETE` | `/:id` | Cég törlése (Soft delete). |
| `PATCH` | `/:id/reactivate` | Cég újraaktiválása. |
| `PATCH` | `/:id/deactivate` | Cég inaktiválása. |

### 💼 Állások / Pozíciók (`/api/jobs/positions`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Minden aktív pozíció listázása. |
| `POST` | `/` | Új pozíció létrehozása. |
| `GET` | `/:id` | Pozíció részletei. |
| `PATCH` | `/:id` | Pozíció frissítése. |
| `DELETE` | `/:id` | Pozíció törlése. |
| `PATCH` | `/:id/deactivate`| Pozíció inaktiválása. |
| `GET` | `/company/:companyId` | Egy adott cég pozíciói. |

### 📝 Jelentkezések (`/api/applications`)

| Metódus | Végpont | Leírás | Jogosultság |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Jelentkezés leadása. | Student |
| `GET` | `/` | Saját jelentkezések megtekintése. | Student |
| `PATCH` | `/:id/retract` | Jelentkezés visszavonása. | Student |
| `GET` | `/company` | Céghez érkezett jelentkezések. | Company |
| `PATCH` | `/company/:id/evaluate` | Jelentkezés értékelése. (`ACCEPTED` esetén automatikusan létrejön a partnerség). | Company |
| `PATCH` | `/company/:id` | Értékelés módosítása. | Company |
| `GET` | `/admin` | Összes jelentkezés (Admin nézet). | Admin |
| `GET` | `/admin/:id` | Jelentkezés részletei. | Admin |
| `PATCH` | `/admin/:id` | Jelentkezés módosítása. | Admin |

### 📰 Hírek (`/api/news`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Hírek listázása (hallgatóknak/felhasználóknak). |
| `GET` | `/:id` | Hír részletei. |
| `POST` | `/admin` | Hír létrehozása (Admin). |
| `GET` | `/admin` | Hírek kezelése (Admin lista). |
| `GET` | `/admin/archived` | Archivált hírek. |
| `PATCH` | `/admin/:id` | Hír szerkesztése. |
| `PATCH` | `/admin/:id/archive` | Hír archiválása. |
| `PATCH` | `/admin/:id/unarchive` | Hír visszaállítása. |
| `DELETE` | `/admin/:id` | Hír végleges törlése vagy soft delete. |

### 🔔 Értesítések (`/api/notifications`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Olvasatlan/Aktív értesítések. |
| `GET` | `/archived` | Archivált értesítések. |
| `GET` | `/:id` | Értesítés részletei. |
| `GET` | `/unread-count` | Olvasatlan értesítések száma. |
| `POST` | `/` | Új értesítés létrehozása. |
| `PUT` | `/read-all` | Minden megjelölése olvasottként. |
| `PUT` | `/:id/read` | Egy elem olvasottnak jelölése. |
| `PUT` | `/:id/archive` | Értesítés archiválása. |
| `PUT` | `/:id/unarchive` | Értesítés visszaállítása. |
| `DELETE` | `/:id` | Értesítés törlése. |

### 📊 Statisztika (`/api/stats`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Rendszerszintű statisztikák lekérése. |

### 🤝 Duális Partnerkapcsolatok (`/api/partnerships`)

A hallgatók és cégek közötti duális képzési szerződések kezelése.
A partnerség automatikusan létrejön `PENDING_MENTOR` státusszal, amikor a cég elfogad egy jelentkezést (`ACCEPTED`).

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/student` | Hallgató saját partnerségeinek listázása. |
| `GET` | `/company` | Céghez tartozó partnerségek listázása. |
| `GET` | `/university` | Összes partnerség listázása (Egyetem). |
| `GET` | `/:id` | Partnerkapcsolat részletei. |
| `PATCH` | `/:id` | Partnerkapcsolat adatainak frissítése. |
| `PATCH` | `/:id/assign-mentor` | Mentor hozzárendelése (Cégadmin). |
| `PATCH` | `/:id/assign-university-user` | Egyetemi felelős hozzárendelése (Admin). |
| `PATCH` | `/:id/terminate` | Partnerkapcsolat megszakítása (Terminated státusz). |
| `DELETE` | `/:id` | Partnerkapcsolat törlése (Soft delete). |

### 🏢 Cég Adminisztrátorok (`/api/company-admins`)

A cégek adminisztrátorainak kezelése.

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Összes cégadmin listázása. |
| `GET` | `/me` | Saját profil lekérése. |
| `PATCH` | `/me` | Saját profil frissítése. |
| `DELETE` | `/me` | Saját profil törlése. |
| `GET` | `/:id` | Cégadmin lekérése ID alapján. |
| `PATCH` | `/:id` | Adatok frissítése (Admin). |
| `DELETE` | `/:id` | Cégadmin törlése (Admin). |
| `PATCH` | `/restore/:id` | Törölt cégadmin visszaállítása. |

### 👨‍💼 Munkavállalók (`/api/employees`)

Céges munkavállalók (pl. mentorok) kezelése.

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Céghez tartozó munkavállalók listázása. |
| `GET` | `/mentors` | Csak a mentorok listázása (Cégadminnak). |
| `GET` | `/me` | Saját profil lekérése. |
| `PATCH` | `/me` | Saját profil frissítése. |
| `DELETE` | `/me` | Saját profil törlése. |
| `GET` | `/:id` | Munkavállaló lekérése ID alapján. |
| `PATCH` | `/:id` | Munkavállaló frissítése (Admin/CompanyAdmin). |
| `DELETE` | `/:id` | Munkavállaló törlése (Admin/CompanyAdmin). |

### 🎓 Egyetemi Felhasználók (`/api/university-users`)

Egyetemi kapcsolattartók és adminisztrátorok.

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Összes egyetemi felhasználó listázása. |
| `GET` | `/me` | Saját profil lekérése. |
| `PATCH` | `/me` | Saját profil frissítése. |
| `DELETE` | `/me` | Saját profil törlése. |
| `GET` | `/:id` | Egyetemi felhasználó lekérése ID alapján. |
| `PATCH` | `/:id` | Adatok frissítése (Admin). |
| `DELETE` | `/:id` | Törlés (Admin). |

### 🛠 Rendszer Adminisztrátorok (`/api/system-admins`)

A platform üzemeltetői.

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/` | Összes rendszeradmin listázása. |
| `GET` | `/admin-users` | Minden admin (Rendszer, Cég, Egyetem) listázása. |
| `GET` | `/me` | Saját admin profil lekérése. |
| `PATCH` | `/me` | Saját admin profil frissítése. |
| `DELETE` | `/me` | Saját admin profil törlése. |
| `GET` | `/:id` | Rendszeradmin lekérése ID alapján. |
| `PATCH` | `/:id` | Adatok frissítése (Superadmin). |
| `DELETE` | `/:id` | Admin törlése (Superadmin). |

### 👥 Felhasználók (`/api/users`)

Általános felhasználókezelés (pl. inaktív fiókok).

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `GET` | `/inactive` | Inaktív felhasználók listázása. |
| `PATCH` | `/:id/reactivate` | Felhasználó visszaállítása. |
| `PATCH` | `/:id/deactivate` | Felhasználó felfüggesztése. |

---
**Megjegyzés**: Ez a dokumentáció a projekt jelenlegi állapotát tükrözi. API változtatások esetén kérjük a dokumentáció frissítését.