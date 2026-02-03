# Rendszergazdai Követelmények - Duális Képzés Backend

Ez a dokumentum összefoglalja a backend rendszer futtatásához és karbantartásához szükséges szolgáltatásokat, hitelesítő adatokat és konfigurációkat éles környezetben.

## 1. Futtatókörnyezet
- **Node.js**: 20.x (LTS) vagy újabb verzió ajánlott.
- **Csomagkezelő**: `npm` (a Node.js tartalma).
- **Folyamatkezelő**: `PM2` vagy Docker használata javasolt a folyamatos futás biztosításához.

## 2. Adatbázis (PostgreSQL)
A rendszer Prisma ORM-et használ PostgreSQL-lel.
- **Verzió**: PostgreSQL 15 vagy újabb.
- **Direkt kapcsolati URL** (`DIRECT_URL`): Adatbázis migrációkhoz és séma frissítésekhez.
- **Tranzakciós kapcsolati URL** (`DATABASE_URL`): Ajánlott egy kapcsolati pooler (pl. PgBouncer) használata az alkalmazás forgalmához.
- **Bővítmények**: Standard PostgreSQL bővítmények.

## 3. Üzenetküldő sor és Gyorsítótár (Message Queue / Cache)
A rendszer háttérfolyamatokhoz (pl. e-mailek kiküldése, naplózás feldolgozása) külső szolgáltatást igényel.
- **Megjegyzés**: A fejlesztés **Redis** (v6.0+) alapú technológiára épült (BullMQ könyvtárral). 
- **Szolgáltatás**: Redis Server ajánlott (v6.0+). 
- **Példák**: [Upstash](https://upstash.com/) (Serverless), [Redis Cloud](https://redis.io/cloud/), [Dragonfly](https://www.dragonflydb.io/), [KeyDB](https://docs.keydb.dev/).
- **Konfiguráció**:
  - `REDIS_HOST`, `REDIS_PORT` (alapértelmezett: 6379), `REDIS_PASSWORD` (ha van).
  - `REDIS_ENABLED`: Éles környezetben `true` értékre állítandó.

## 4. E-mail szolgáltatás (SMTP)
Szükséges a regisztrációhoz, jelszó-visszaállításhoz és automatikus értesítésekhez.
- **SMTP Host**: (pl. `smtp.office365.com`, `smtp.sendgrid.net`).
- **SMTP Port**: (általában 587 TLS-hez vagy 465 SSL-hez).
- **Hitelesítés**: Felhasználónév és jelszó.
- **Küldő címe**: Az e-mail cím, amit a rendszer feladóként használ.

## 5. Biztonság és Azonosítás
- **JWT Titok** (`JWT_SECRET`): Egy hosszú, véletlenszerű karakterlánc a tokenek aláírásához.
- **CORS Beállítás**: Az engedélyezett források listája (jellemzően a Frontend éles URL-je).

## 6. Hálózat és URL-ek
- **Backend URL**: A backend publikus elérhetősége.
- **Frontend URL**: A frontend publikus elérhetősége (az e-mailekben szereplő linkekhez).
- **SSL**: HTTPS használata kötelező a biztonságos adatátvitel érdekében.

## 7. Tárolás (GDPR megfelelőség)
- **Implementáció**: A rendszer **Memory Storage**-ot használ a feltöltésekhez (önéletrajzok, motivációs levelek). A fájlok továbbításra kerülnek a HR-nek, nem tárolódnak helyi lemezen.
- **Lemezterület**: Minimális igény az alkalmazás számára, mivel nagy fájlokat nem tárol tartósan a backend.

## 8. Környezeti változó sablon (.env)

A rendszergazdának a következő kulcsokhoz kell értékeket biztosítania:

```env
# Adatbázis
DATABASE_URL="postgresql://user:pass@host:port/dbname?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:port/dbname"

# Biztonság
JWT_SECRET="generálj-egy-hosszú-véletlen-karakterláncot"
NODE_ENV="production"

# Hálózat
FRONTEND_URL="https://frontend-domain.hu"
PORT=3000

# Redis (Sorokhoz és gyorsítótárhoz)
REDIS_ENABLED="true"
REDIS_URL="rediss://default:password@host:port" 
# VAGY külön komponensekkel:
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=password

# E-mail (SMTP)
SMTP_HOST="smtp.provider.com"
SMTP_PORT=587
SMTP_USER="felhasznalonev/apikey"
SMTP_PASS="jelszo/secret"
```

---
> [!IMPORTANT]
> Győződjön meg róla, hogy minden érzékeny adatot biztonságos vault-ban vagy védett `.env` fájlban tárol a szerveren.
