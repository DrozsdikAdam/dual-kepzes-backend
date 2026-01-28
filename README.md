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
-   **Tesztelés**: [Jest](https://jestjs.io/) & [Supertest](https://github.com/ladjs/supertest) - Unit és integrációs tesztek a megbízhatóság érdekében.
-   **Dokumentáció**: [Swagger/OpenAPI](https://swagger.io/) - Interaktív API dokumentáció és végpont tesztelési felület.

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

    # Frontend URL (jelszó visszaállító linkhez)
    FRONTEND_URL="http://localhost:3000"

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
| `npm run test` | Unit és integrációs tesztek futtatása. |
| `npm run lint` | Kódminőség ellenőrzése (ESLint v9). |
| `npm run format` | Kód automatikus formázása (Prettier). |
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

Minden végpont a `/api` prefix alatt érhető el. A legtöbb végponthoz érvényes `Authorization: Bearer <token>` fejléc szükséges.

## 📚 API Dokumentáció

Az összes API végpont **teljes dokumentációja interaktív Swagger felületen** keresztül érhető el:

👉 **Helyi fejlesztés**: `http://localhost:3000/api-docs`  
👉 **Production**: `https://dual-kepzes-backend-production-7c45.up.railway.app/api-docs`

A Swagger UI lehetőséget ad:
- ✅ Végpontok részletes leírásának megtekintésére
- ✅ Sémák és válaszok vizuális megjelenítésére  
- ✅ Interaktív tesztelésre (Try it out!)
- ✅ Autentikációs token használatára

### 📄 Lapozás (Pagination)
A listázó végpontok egységes válaszstruktúrát és lekérdezési paramétereket használnak. Részleteket az [API_PAGINATION.md](API_PAGINATION.md) fájlban találsz.

## 🔐 Szerepkörök és Jogosultságok

| Szerepkör | Leírás | Főbb jogosultságok |
|:----------|:-------|:-------------------|
| `STUDENT` | Hallgató | Saját profil, jelentkezések, partnerségek megtekintése |
| `COMPANY_EMPLOYEE` | Céges munkavállaló | Cég pozíciói, jelentkezések megtekintése, mentor funkciók |
| `COMPANY_ADMIN` | Cégadmin | Teljes cégkezelés, jelentkezések értékelése, pozíciók és munkavállalók kezelése |
| `UNIVERSITY_USER` | Egyetemi kapcsolattartó | Partnerségek jóváhagyása, hallgatók felügyelete |
| `SYSTEM_ADMIN` | Rendszergazda | Teljes rendszer adminisztráció, minden entitás kezelése |

## 🗄️ Adatbázis Séma Áttekintés

A rendszer fő entitásai és kapcsolataik:

```mermaid
erDiagram
    User ||--o| StudentProfile : has
    User ||--o| CompanyEmployee : has
    Company ||--o{ CompanyEmployee : employs
    Company ||--o{ Position : offers
    Student ||--o{ Application : submits
    Position ||--o{ Application : receives
    Application ||--o| DualPartnership : creates
    DualPartnership }o--|| Student : involves
    DualPartnership }o--|| Position : involves
    DualPartnership }o--o| CompanyEmployee : mentor
    DualPartnership }o--o| UniversityUser : supervisor
```

**Részletes sémát** lásd: `prisma/schema.prisma` vagy Prisma Studio (`npm run prisma:studio`)

## 🏛️ Rendszer Architektúra

A backend alkalmazás rétegelt architektúrát követ:

```mermaid
graph TB
    subgraph "Client Layer"
        FE[Frontend Application]
        Swagger[Swagger UI]
    end
    
    subgraph "API Layer"
        Router[Express Router]
        Auth[Auth Middleware]
        Validation[Validation Middleware]
        RateLimit[Rate Limiting]
    end
    
    subgraph "Business Logic Layer"
        Controllers[Controllers]
        Services[Services]
    end
    
    subgraph "Data Layer"
        Prisma[Prisma ORM]
        DB[(PostgreSQL)]
    end
    
    subgraph "External Services"
        Redis[(Redis - BullMQ)]
        SMTP[Email Service]
    end
    
    FE -->|HTTP/REST| Router
    Swagger -->|HTTP/REST| Router
    Router --> Auth
    Auth --> Validation
    Validation --> RateLimit
    RateLimit --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> DB
    Services -.->|Background Jobs| Redis
    Services -.->|Notifications| SMTP
```

## 🔄 Request Processing Flow

Egy tipikus API kérés feldolgozásának menete:

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant AuthMW as Auth Middleware
    participant ValidateMW as Validation MW
    participant Controller
    participant Service
    participant Prisma
    participant DB as PostgreSQL

    Client->>Express: HTTP Request + JWT Token
    Express->>AuthMW: Validate Token
    
    alt Token Invalid
        AuthMW-->>Client: 401 Unauthorized
    else Token Valid
        AuthMW->>ValidateMW: Proceed with User Context
        ValidateMW->>ValidateMW: Validate Input (Zod)
        
        alt Validation Failed
            ValidateMW-->>Client: 400 Bad Request
        else Validation Passed
            ValidateMW->>Controller: Execute Handler
            Controller->>Service: Business Logic
            Service->>Prisma: Database Query
            Prisma->>DB: SQL Query
            DB-->>Prisma: Result Set
            Prisma-->>Service: Typed Data
            Service-->>Controller: Processed Data
            Controller-->>Client: 200 OK + JSON Response
        end
    end
```

## 🔐 Autentikációs Flow

JWT token alapú autentikáció működése:

```mermaid
sequenceDiagram
    participant User
    participant API
    participant DB
    participant JWT as JWT Service

    User->>API: POST /api/auth/register
    API->>DB: Check if email exists
    
    alt Email exists
        DB-->>API: Email already registered
        API-->>User: 409 Conflict
    else New user
        API->>API: Hash password (bcrypt)
        API->>DB: Create new user
        DB-->>API: User created
        API-->>User: 201 Created
    end

    User->>API: POST /api/auth/login (email, password)
    API->>DB: Find user by email
    DB-->>API: User data
    API->>API: Compare password hash
    
    alt Password invalid
        API-->>User: 401 Unauthorized
    else Password valid
        API->>JWT: Generate token (userId, role)
        JWT-->>API: JWT Token
        API-->>User: 200 OK + Token
    end

    User->>API: GET /api/students/me + Bearer Token
    API->>JWT: Verify & Decode Token
    JWT-->>API: User ID & Role
    API->>DB: Fetch user data
    DB-->>API: User data
    API-->>User: 200 OK + User Profile
```

## 🎯 Partnership Status Flow

A duális partnerség életciklusa (státusz átmenetek):

```mermaid
stateDiagram-v2
    [*] --> PENDING_MENTOR: Application ACCEPTED

    PENDING_MENTOR --> PENDING_UNIVERSITY: Mentor Assigned
    
    PENDING_UNIVERSITY --> ACTIVE: University User Assigned
    
    ACTIVE --> TERMINATED: Partnership Terminated
    ACTIVE --> COMPLETED: Natural Completion
    
    PENDING_MENTOR --> TERMINATED: Early Termination
    PENDING_UNIVERSITY --> TERMINATED: Early Termination
    
    TERMINATED --> [*]
    COMPLETED --> [*]
    
    note right of PENDING_MENTOR
        Company has accepted
        the student's application
    end note
    
    note right of PENDING_UNIVERSITY
        Mentor assigned,
        awaiting university approval
    end note
    
    note right of ACTIVE
        Fully operational
        dual education partnership
    end note
    
    style PENDING_MENTOR fill:#ff9800,stroke:#e65100,stroke-width:3px,color:#000
    style PENDING_UNIVERSITY fill:#2196f3,stroke:#0d47a1,stroke-width:3px,color:#fff
    style ACTIVE fill:#4caf50,stroke:#1b5e20,stroke-width:3px,color:#fff
    style TERMINATED fill:#f44336,stroke:#b71c1c,stroke-width:3px,color:#fff
    style COMPLETED fill:#00897b,stroke:#004d40,stroke-width:3px,color:#fff
```

## 📊 Application to Partnership Process

A jelentkezéstől a partnerségig vezető üzleti folyamat:

```mermaid
flowchart TD
    Start([Student Browses Jobs]) --> Apply[Submit Application]
    Apply --> Status{Application Status}
    
    Status -->|PENDING| Wait[Wait for Company Review]
    Wait --> Status
    
    Status -->|REJECTED| End1([Application Closed])
    
    Status -->|ACCEPTED| CreatePartnership[Auto-create Partnership]
    CreatePartnership --> P1[Partnership: PENDING_MENTOR]
    
    P1 --> AssignMentor{Company Assigns Mentor?}
    AssignMentor -->|Yes| P2[Partnership: PENDING_UNIVERSITY]
    AssignMentor -->|No| P1
    
    P2 --> Notify1[Notify System Admins]
    Notify1 --> AssignUni{University Assigns Supervisor?}
    AssignUni -->|Yes| P3[Partnership: ACTIVE]
    AssignUni -->|No| P2
    
    P3 --> Monitor[Ongoing Mentorship]
    Monitor --> Complete{Completion or Termination?}
    Complete -->|Terminated| End2([Partnership: TERMINATED])
    Complete -->|Completed| End3([Partnership: COMPLETED])
    
    style Start fill:#9e9e9e,stroke:#424242,stroke-width:2px,color:#fff
    style Apply fill:#03a9f4,stroke:#01579b,stroke-width:2px,color:#fff
    style Status fill:#ffc107,stroke:#f57f17,stroke-width:2px,color:#000
    style Wait fill:#ff9800,stroke:#e65100,stroke-width:2px,color:#000
    style End1 fill:#f44336,stroke:#b71c1c,stroke-width:3px,color:#fff
    style CreatePartnership fill:#8bc34a,stroke:#33691e,stroke-width:2px,color:#000
    style P1 fill:#ff9800,stroke:#e65100,stroke-width:3px,color:#000
    style AssignMentor fill:#ffc107,stroke:#f57f17,stroke-width:2px,color:#000
    style P2 fill:#2196f3,stroke:#0d47a1,stroke-width:3px,color:#fff
    style Notify1 fill:#00bcd4,stroke:#006064,stroke-width:2px,color:#fff
    style AssignUni fill:#2196f3,stroke:#0d47a1,stroke-width:2px,color:#fff
    style P3 fill:#4caf50,stroke:#1b5e20,stroke-width:3px,color:#fff
    style Monitor fill:#8bc34a,stroke:#33691e,stroke-width:2px,color:#000
    style Complete fill:#cddc39,stroke:#827717,stroke-width:2px,color:#000
    style End2 fill:#f44336,stroke:#b71c1c,stroke-width:3px,color:#fff
    style End3 fill:#00897b,stroke:#004d40,stroke-width:3px,color:#fff
```

## 🚀 Deployment Architecture

Éles környezet (Railway) architektúrája:

```mermaid
graph LR
    subgraph "Railway Platform"
        subgraph "Backend Service"
            API[Node.js/Express API]
            Worker[BullMQ Worker]
        end
        
        subgraph "Databases"
            PostgreSQL[(PostgreSQL)]
            Redis[(Redis)]
        end
        
        ENV[Environment Variables]
    end
    
    subgraph "External Services"
        SMTP[SMTP Email Provider]
        DNS[Custom Domain/DNS]
    end
    
    Internet((Internet)) --> DNS
    DNS --> API
    API --> PostgreSQL
    API --> Redis
    Worker --> Redis
    Worker --> SMTP
    Worker --> PostgreSQL
    ENV -.-> API
    ENV -.-> Worker
    
    style API fill:#0066cc,color:#fff
    style Worker fill:#0066cc,color:#fff
    style PostgreSQL fill:#336791,color:#fff
    style Redis fill:#dc382d,color:#fff
```

## ⚠️ Hibakezelés

### Hibakódok

| HTTP Státusz | Hibakód | Leírás |
|:-------------|:--------|:-------|
| `400` | `INVALID_INPUT` | Hibás bemeneti adatok (validációs hiba) |
| `400` | `BAD_REQUEST` | Érvénytelen kérés (pl. hibás JSON formátum) |
| `401` | `UNAUTHORIZED` | Hiányzó vagy érvénytelen token |
| `403` | `FORBIDDEN` | Nincs jogosultság a művelethez (pl. CORS hiba) |
| `404` | `NOT_FOUND` | A keresett erőforrás nem található |
| `409` | `CONFLICT` | Ütköző művelet (pl. duplikált email) |
| `500` | `INTERNAL_ERROR` | Belső szerverhiba |

### Hibák formátuma
```json
{
  "success": false,
  "message": "Hiba rövid leírása",
  "error": {
    "code": "INVALID_INPUT",
    "message": "Részletes hibaüzenet",
    "details": { /* Opcionális részletek */ }
  }
}
```

## 🚀 Quick Start - API Használat

### 1. Regisztráció és bejelentkezés
```bash
# Regisztráció
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hallgato@pelda.hu",
    "password": "Jelszo123!",
    "fullName": "Teszt Hallgató",
    "role": "STUDENT"
  }'

# Bejelentkezés
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hallgato@pelda.hu",
    "password": "Jelszo123!"
  }'
```

### 2. Védett végpont hívása
```bash
# Saját profil lekérése (helyettesítsd be a kapott tokent)
curl http://localhost:3000/api/students/me \
  -H "Authorization: Bearer <your_token_here>"
```

> **💡 Tipp**: A teljes API végpontokat és sémákat a [Swagger UI](#-api-dokumentáció)-n keresztül is kipróbálhatod!

---

## 📋 API Végpontok Referencia

### 🔐 Autentikáció (`/api/auth`)

| Metódus | Végpont | Leírás |
| :--- | :--- | :--- |
| `POST` | `/register` | Új felhasználó regisztrációja. |
| `POST` | `/login` | Bejelentkezés és JWT token igénylése. |
| `POST` | `/request-password-reset` | Jelszó visszaállítás kérése email címmel. |
| `POST` | `/reset-password` | Új jelszó beállítása tokennel. |


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
| `GET` | `/` | Aktív pozíciók listázása. (Opcionális: `?isDual=true` vagy `false`) |
| `GET` | `/dual` | Kizárólag duális pozíciók listázása. |
| `GET` | `/non-dual` | Kizárólag nem duális pozíciók listázása. |
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