# Duális Képzés Backend

Backend API a duális képzési rendszerhez. A szolgáltatás hallgatók, céges szerepkörök, egyetemi felhasználók és rendszeradminisztrátorok folyamatait támogatja egy role-based, REST alapú backenddel.

## Áttekintés

A projekt fő céljai:

- hallgatói és adminisztratív workflow-k kiszolgálása
- cégek, pozíciók, jelentkezések és partnerségek kezelése
- szerepkör alapú hozzáférés-vezérlés
- validált, dokumentált API biztosítása frontend és admin kliensek számára
- biztonságos, bővíthető backend architektúra fenntartása

Főbb technológiák:

- **Node.js**: eseményvezérelt szerveroldali futtatókörnyezet az API kiszolgálásához
- **[Node.js](https://nodejs.org/)**: eseményvezérelt szerveroldali futtatókörnyezet az API kiszolgálásához
- **[TypeScript](https://www.typescriptlang.org/)**: statikus típusosság a kontrollerektől a service rétegig
- **[Express](https://expressjs.com/)**: könnyű, jól kontrollálható HTTP keretrendszer
- **[Prisma](https://www.prisma.io/)**: típusos adat-hozzáférési réteg és sémakezelés PostgreSQL fölött
- **[PostgreSQL](https://www.postgresql.org/)**: relációs adatbázis a domain entitások és kapcsolatok tárolására
- **[Zod](https://zod.dev/)**: request validáció és input normalizálás
- **[JWT](https://jwt.io/)**: token alapú autentikáció és role-based hozzáférés
- **[BullMQ](https://docs.bullmq.io/)**: háttérfolyamatok és queue alapú feldolgozás
- **[Redis](https://redis.io/)**: queue backend és később többpéldányos koordináció lehetséges alapja
- **[Jest](https://jestjs.io/)**: unit és részben integrációs tesztelés
- **[Swagger / OpenAPI](https://swagger.io/)**: interaktív API dokumentáció és szerződéskövetés

## Architektúra

A kód klasszikus rétegezést követ:

- `routes`: endpoint definíciók és middleware lánc
- `controllers`: HTTP szintű request-response kezelés
- `services`: üzleti logika
- `schemas`: Zod validációs sémák
- `middlewares`: auth, validáció, hibakezelés, rate limiting, idempotency
- `config`: infrastruktúra és integrációs konfiguráció
- `utils`: közös segédfüggvények
- `prisma`: adatmodell, migrációk, seed

Ez a felosztás addig működik jól, amíg a kontrollerek vékonyak maradnak, az üzleti szabályok a service rétegben vannak, és a middleware-ek nem kezdenek domain logikát hordozni.

### Architektúra diagram

```mermaid
flowchart TB
    subgraph "Client Layer"
        FE["Frontend Application"]
        Swagger["Swagger UI"]
    end

    subgraph "API Layer"
        Router["Express Router"]
        Auth["Auth Middleware"]
        Validation["Validation Middleware"]
        Sanitization["Sanitization Middleware"]
        RateLimit["Rate Limiting"]
        ErrorHandler["Error Handler"]
    end

    subgraph "Business Layer"
        Controllers["Controllers"]
        Services["Services"]
    end

    subgraph "Data Layer"
        Prisma["Prisma Client + Extensions"]
        DB["PostgreSQL"]
    end

    subgraph "External Services"
        Redis["Redis / BullMQ"]
        SMTP["SMTP Provider"]
        Storage["S3 / Supabase Storage"]
    end

    FE --> Router
    Swagger --> Router
    Router --> Auth
    Auth --> Validation
    Validation --> Sanitization
    Sanitization --> RateLimit
    RateLimit --> Controllers
    Controllers --> Services
    Services --> Prisma
    Prisma --> DB
    Services --> Redis
    Redis --> SMTP
    Services --> Storage
    Controllers --> ErrorHandler
    Auth --> ErrorHandler
    Validation --> ErrorHandler
    Services --> ErrorHandler
```

### Request feldolgozási folyamat

```mermaid
sequenceDiagram
    participant Client
    participant Express
    participant Middleware
    participant Controller
    participant Service
    participant Prisma
    participant DB as PostgreSQL

    Client->>Express: HTTP request
    Express->>Middleware: CORS + security + parsing
    Middleware->>Middleware: auth + validation + rate limit

    alt middleware error
        Middleware-->>Client: structured error response
    else request allowed
        Middleware->>Controller: validated request
        Controller->>Service: business operation
        Service->>Prisma: query / transaction
        Prisma->>DB: SQL
        DB-->>Prisma: result
        Prisma-->>Service: typed result
        Service-->>Controller: domain response
        Controller-->>Client: JSON response
    end
```

## Funkcionális területek

A jelenlegi backend az alábbi fő domain területeket kezeli:

- autentikáció és jelszókezelés
- hallgatói profilok
- cégek és céges adminisztráció
- pozíciók és jelentkezések
- duális partnerségek
- értesítések
- hírek
- tananyag teljesítések
- statisztikák
- képfeltöltés és galéria funkciók

## Követelmények

- Node.js 18+
- npm
- PostgreSQL
- opcionálisan Redis, ha a queue alapú háttérfolyamatok is kellenek

## Gyors indítás

1. Függőségek telepítése

```bash
npm install
```

2. Környezeti változók beállítása egy `.env` fájlban

3. Adatbázis séma szinkronizálása

```bash
npm run prisma:push
```

4. Fejlesztői szerver indítása

```bash
npm run dev
```

Alapértelmezett URL:

```text
http://localhost:3000
```

Swagger:

```text
http://localhost:3000/api-docs
```

## Környezeti változók

Az alkalmazás a jelenlegi fejlesztői környezetben a Prisma kapcsolatot `DIRECT_URL` alapján használja. Ez tudatos döntés a mostani adatbázis-kapcsolódási mód miatt.

Éles környezetben a cél az, hogy a kapcsolat `DATABASE_URL` alapú legyen. Ezt a deploy környezettel és a Prisma konfigurációval együtt kell majd véglegesíteni.

Minimálisan hasznos `.env` példa:

```env
PORT=3000
NODE_ENV=development

JWT_SECRET=replace-with-a-strong-secret
FRONTEND_URL=http://localhost:3000

DIRECT_URL=postgresql://user:password@localhost:5432/dual_db?schema=public

REDIS_ENABLED=false
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_pass
EMAILS_ENABLED=false

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

SUPABASE_S3_REGION=eu-central-1
SUPABASE_S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
SUPABASE_S3_ACCESS_KEY_ID=your_access_key
SUPABASE_S3_SECRET_ACCESS_KEY=your_secret_key
SUPABASE_S3_BUCKET_NAME=ImageBucket
SUPABASE_PUBLIC_URL=https://your-project.supabase.co/storage/v1/object/public
```

## Fontos működési megjegyzések

- Az email küldés jelenleg tudatosan kikapcsolható vagy mockolható, amíg a végleges SMTP infrastruktúra nincs készen.
- Az idempotency middleware jelenleg memória alapú. Ez egy példányos futásnál megfelelő, több példányos deploymentnál viszont Redis vagy más központi store ajánlott.
- A szerver időzónája `Europe/Budapest`.
- Több entitásnál soft delete működik, ezért a lekérdezési viselkedést a Prisma kiterjesztés is befolyásolja.

## Fő folyamatok

### Auth folyamat

Az auth jelenlegi működésének fontosabb pontjai:

- JWT alapú beléptetés
- role alapú jogosultságkezelés
- jelszó reset tokenes flow
- email verifikációs endpointok léteznek, de a küldési oldal jelenleg infrastruktúra-függő

```mermaid
sequenceDiagram
    participant U as User
    participant API as Backend API
    participant DB as PostgreSQL
    participant JWT as JWT

    U->>API: POST /api/auth/login
    API->>DB: user lookup by email
    DB-->>API: user + company context
    API->>API: password check + active check

    alt invalid credentials or inactive user
        API-->>U: 400 / 401 / 403
    else valid login
        API->>JWT: sign token
        JWT-->>API: bearer token
        API-->>U: 200 + token + user summary
    end
```

### Regisztráció és bejelentkezés részletes folyamat

```mermaid
sequenceDiagram
    participant User
    participant API
    participant DB
    participant JWT

    User->>API: POST /api/auth/register
    API->>DB: email uniqueness check
    alt email already exists
        API-->>User: 400
    else valid registration
        API->>DB: create user and role-specific profile
        DB-->>API: created user
        API-->>User: 201
    end

    User->>API: POST /api/auth/login
    API->>DB: find user by email
    alt invalid credentials
        API-->>User: 400
    else inactive or deleted user
        API-->>User: 401 / 403
    else company status blocks login
        API-->>User: 401
    else login allowed
        API->>JWT: generate token
        JWT-->>API: signed token
        API-->>User: 200 + token
    end
```

### Jelentkezési folyamat

A jelentkezési logika jelenleg két fő belépési pontot kezel:

- sima jelentkezés
- jelentkezés csatolmányokkal

Az elfogadott jelentkezés partnerséget is létrehozhat.

```mermaid
flowchart TD
    Start["Student applies"] --> Exists{"Position active and exists?"}
    Exists -- "No" --> NotFound["Reject request"]
    Exists -- "Yes" --> Duplicate{"Already applied?"}
    Duplicate -- "Yes" --> DuplicateStop["Reject request"]
    Duplicate -- "No" --> CreateApp["Create application with SUBMITTED status"]
    CreateApp --> NotifyAdmins["Notify company admins"]
    NotifyAdmins --> WaitEval["Company evaluates application"]

    WaitEval --> EvalStatus{"Status"}
    EvalStatus -->|"REJECTED"| Rejected["Application closed"]
    EvalStatus -->|"NO_RESPONSE"| NoResponse["No response recorded"]
    EvalStatus -->|"ACCEPTED"| PartnershipCheck{"Existing active or pending partnership?"}
    PartnershipCheck -->|"Yes"| PartnershipConflict["Reject acceptance"]
    PartnershipCheck -->|"No"| CreatePartnership["Create DualPartnership with PENDING_MENTOR"]
```

### Jelentkezésből partnerség folyamat

```mermaid
flowchart TD
    Start["Student browses positions"] --> Apply["Submit application"]
    Apply --> Review["Company reviews application"]
    Review --> Decision{"Decision"}

    Decision -->|"REJECTED"| Rejected["Application closed"]
    Decision -->|"NO_RESPONSE"| NoResponse["No response recorded"]
    Decision -->|"ACCEPTED"| CheckPartnership{"Existing active or pending partnership?"}

    CheckPartnership -->|"Yes"| Conflict["Acceptance rejected"]
    CheckPartnership -->|"No"| CreatePartnership["Create partnership"]
    CreatePartnership --> SuggestReferent["Suggest university referent"]
    SuggestReferent --> PendingMentor["Status: PENDING_MENTOR"]
    PendingMentor --> AssignMentor{"Mentor assigned?"}
    AssignMentor -->|"Yes"| PendingUniversity["Status: PENDING_UNIVERSITY"]
    AssignMentor -->|"No"| PendingMentor
    PendingUniversity --> UniversityDecision{"University decision"}
    UniversityDecision -->|"Approve"| Active["Status: ACTIVE"]
    UniversityDecision -->|"Terminate"| Terminated["Status: TERMINATED"]
    Active --> FinishOrTerminate{"Outcome"}
    FinishOrTerminate -->|"Finish"| Finished["Status: FINISHED"]
    FinishOrTerminate -->|"Terminate"| Terminated
```

### Partnerségi státusz folyamat

```mermaid
stateDiagram-v2
    [*] --> PENDING_MENTOR
    PENDING_MENTOR --> PENDING_UNIVERSITY
    PENDING_MENTOR --> TERMINATED
    PENDING_UNIVERSITY --> ACTIVE
    PENDING_UNIVERSITY --> TERMINATED
    ACTIVE --> FINISHED
    ACTIVE --> TERMINATED
    FINISHED --> [*]
    TERMINATED --> [*]
```

### Jelentkezési státusz átmenetek

Ez a diagram a jelenlegi `status-transition` util logikáját követi.

```mermaid
stateDiagram-v2
    [*] --> SUBMITTED
    SUBMITTED --> ACCEPTED
    SUBMITTED --> REJECTED
    SUBMITTED --> NO_RESPONSE
    SUBMITTED --> RETRACTED
    NO_RESPONSE --> ACCEPTED
    NO_RESPONSE --> REJECTED
    ACCEPTED --> [*]
    REJECTED --> [*]
    RETRACTED --> [*]
```

### GDPR-kompatibilis fájlfeltöltési folyamat

Ez a folyamat a jelenlegi `submit-with-files` endpoint viselkedését írja le.

```mermaid
sequenceDiagram
    participant Student
    participant API
    participant Memory as Memory Buffer
    participant DB as PostgreSQL
    participant Mail as Mailer
    participant HR as Company Admins

    Student->>API: POST /api/applications/submit-with-files
    API->>Memory: multer memory storage
    API->>API: MIME + content validation
    API->>DB: load student and position
    API->>DB: create application
    API-->>Student: 201 created
    API->>Mail: send email in background with attachments
    Mail->>HR: CV and optional motivation letter
    Note over Memory: files are not persisted to local disk
```

## Elérhető parancsok

```bash
npm run dev
npm run build
npm start
npm test
npm run test:watch
npm run test:coverage
npm run lint
npm run format
npm run prisma:format
npm run prisma:push
npm run prisma:studio
npx prisma db seed
```

## Adatbázis

A Prisma schema a `prisma/schema.prisma` fájlban található.

Fontosabb elemek:

- `User`
- `StudentProfile`
- `Company`
- `CompanyEmployee`
- `Position`
- `Application`
- `DualPartnership`
- `Notification`
- `News`
- `MaterialCompletion`
- `GalleryGroup`
- `GalleryImage`
- `CompanyImage`

Migrációk a `prisma/migrations` mappában vannak.

### ER diagram

Az alábbi ábra a jelenlegi Prisma modell legfontosabb kapcsolatait mutatja, a gyakorlati domain-folyamatokra fókuszálva.

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string fullName
        string phoneNumber
        Role role
        boolean isEmailEnabled
        boolean isEmailVerified
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    StudentProfile {
        string id PK
        string userId UK,FK
        string mothersName
        datetime birthDate
        string highSchool
        string highSchoolLocation
        int graduationYear
        string neptunCode
        string majorId FK
        string firstChoiceId FK
        string secondChoiceId FK
        string studyMode
        boolean hasLanguageCert
        boolean isInHighSchool
        boolean isAvailableForWork
        datetime deletedAt
    }

    Company {
        string id PK
        string name
        string taxId UK
        string contactName
        string contactEmail
        string website
        string logoUrl
        boolean hasOwnApplication
        string externalApplicationUrl
        RegistrationStatus status
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    CompanyEmployee {
        string id PK
        string userId UK,FK
        string companyId FK
        string jobTitle
        datetime deletedAt
    }

    Major {
        string id PK
        string name
        string language
    }

    Location {
        string id PK
        string country
        string zipCode
        string city
        string address
        string companyId FK
        string studentProfileId FK
    }

    Position {
        string id PK
        string companyId FK
        string majorId FK
        string locationId FK
        string title
        string description
        PositionType type
        datetime deadline
        boolean isActive
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Tag {
        string id PK
        string name UK
        string category
        datetime deletedAt
    }

    Application {
        string id PK
        string studentId FK
        string positionId FK
        ApplicationStatus status
        string companyNote
        datetime submittedAt
        datetime updatedAt
        datetime deletedAt
    }

    DualPartnership {
        string id PK
        string studentId FK
        string mentorId FK
        string uniEmployeeId FK
        string positionId FK
        string semester
        string contractNumber
        PartnershipStatus status
        datetime startDate
        datetime endDate
        datetime createdAt
        datetime updatedAt
        datetime deletedAt
    }

    Notification {
        string id PK
        string userId FK
        string title
        string message
        string type
        boolean isRead
        string status
        boolean isArchived
        datetime createdAt
        datetime deletedAt
    }

    News {
        string id PK
        string title
        string content
        boolean isImportant
        string targetGroup
        boolean isArchived
        datetime createdAt
        datetime deletedAt
    }

    MaterialCompletion {
        string id PK
        string materialId
        string studentProfileId FK
        boolean isCompleted
        int rating
        datetime completedAt
    }

    GalleryGroup {
        string id PK
        string title
        string description
    }

    GalleryImage {
        string id PK
        string galleryGroupId FK
        string url
        string publicId
        string caption
        int order
    }

    CompanyImage {
        string id PK
        string companyId FK
        string url
        string publicId
        string caption
        int order
    }

    User ||--o| StudentProfile : has
    User ||--o| CompanyEmployee : has
    User ||--o{ Notification : receives
    User ||--o{ DualPartnership : supervises
    User }o--o{ Major : manages
    User }o--o{ Company : manages

    StudentProfile }o--o| Major : current_major
    StudentProfile }o--o| Major : first_choice
    StudentProfile }o--o| Major : second_choice
    StudentProfile ||--o{ Location : has
    StudentProfile ||--o{ Application : submits
    StudentProfile ||--o{ DualPartnership : participates
    StudentProfile ||--o{ MaterialCompletion : completes

    Company ||--o{ CompanyEmployee : employs
    Company ||--o{ Position : offers
    Company ||--o{ Location : has
    Company ||--o{ CompanyImage : owns

    Position }o--o| Major : targets
    Position }o--o| Location : located_at
    Position }o--o{ Tag : tagged_with
    Position ||--o{ Application : receives
    Position ||--o{ DualPartnership : linked_to

    CompanyEmployee ||--o{ DualPartnership : mentors

    GalleryGroup ||--o{ GalleryImage : contains
```

## API konvenciók

- Minden API a `/api` prefix alatt érhető el.
- A védett végpontok `Authorization: Bearer <token>` headert várnak.
- A request validációt Zod végzi.
- A hibakezelés központosított middleware-en fut át.
- A legtöbb domain művelet service rétegen keresztül történik.

## Projekt struktúra

```text
src/
├── app.ts                # Express alkalmazás összeállítása
├── server.ts             # belépési pont, szerverindítás
├── config/               # Prisma, Redis, mailer, CORS, Swagger, upload
├── controllers/          # HTTP request/response kezelés
├── errors/               # egyedi alkalmazáshibák
├── middlewares/          # auth, validáció, rate limit, ownership, error handler
├── routes/               # endpoint definíciók és route wiring
├── schemas/              # Zod sémák
├── services/             # üzleti logika és tranzakciós műveletek
├── types/                # közös TypeScript típusok
├── utils/                # közös segédfüggvények és mapperek
└── constants.ts          # közös hibakódok és konstansok

prisma/
├── schema.prisma         # adatmodell
├── migrations/           # adatbázis migrációk
└── seed.ts               # seed script

user_guides/              # szerepkör-specifikus használati anyagok
handover.md               # projektátadási megjegyzések
```

## Fejlesztési irányelvek

- A route réteg maradjon vékony.
- Az üzleti szabályok service-be kerüljenek.
- A validáció a schema rétegben legyen, ne ad hoc a controllerben.
- Új endpointhoz tartozzon Swagger dokumentáció.
- Shared logika esetén előbb meglévő utility vagy service mintához érdemes igazodni.
- Soft delete-os entitásoknál külön figyelni kell a lekérdezési szemantikára.

## Tesztelés

A projektben unit és részben integrációs tesztek vannak `Jest` alapon.

Fő tesztterületek:

- auth
- application
- notification
- partnership
- student
- user
- material
- location

Ajánlott workflow:

```bash
npm test
npm run lint
```

Nagyobb módosítás előtt érdemes célzottan a kapcsolódó service teszteket futtatni, utána teljes tesztkört kérni.

## Dokumentáció

- interaktív API dokumentáció: `/api-docs`
- szerepkör-specifikus használati útmutatók: `user_guides/`
- projektátadási megjegyzések: `handover.md`

## Deployment megjegyzések

Éles telepítésnél különösen fontos:

- stabil `JWT_SECRET`
- végleges adatbázis URL stratégia
- Redis döntés háttérfolyamatokhoz
- SMTP infrastruktúra bekötése
- CORS origin lista explicit kezelése
- logolás és monitorozás egységesítése

## Karbantartási fókuszok

A projekt következő technikai fókuszai tipikusan ezek:

- Swagger és valós route viselkedés folyamatos szinkronban tartása
- soft delete stratégia egyszerűsítése
- response shape-ek következetessége
- dokumentáció naprakészen tartása
- deployment környezetek közötti konfigurációs eltérések explicit kezelése
