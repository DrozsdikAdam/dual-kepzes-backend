# 🐳 Docker Környezet és Konténerizálás

> **Dokumentum célja**: Útmutató a backend Docker image készítéséhez és a konténerizált környezet felépítéséhez.  
> **Utolsó frissítés**: 2026-02-03

---

## 📋 Tartalom

1. [Előfeltételek](#-1-előfeltételek)
2. [Dockerfile Készítése](#-2-dockerfile-készítése)
3. [Multi-Stage Build](#-3-multi-stage-build)
4. [Docker Compose Környezet](#-4-docker-compose-környezet)
5. [Környezeti Változók Kezelése](#-5-környezeti-változók-kezelése)
6. [Nginx Load Balancer](#-6-nginx-load-balancer)
7. [Build és Futtatás](#-7-build-és-futtatás)
8. [Production Optimalizációk](#-8-production-optimalizációk)
9. [Kubernetes Deployment](#-9-kubernetes-deployment)
10. [Troubleshooting](#-10-troubleshooting)

---

## 🔧 1. Előfeltételek

### Szükséges Szoftverek

| Szoftver | Verzió | Leírás |
|:---------|:-------|:-------|
| Docker | 24.x+ | Konténer runtime |
| Docker Compose | 2.x+ | Multi-container orchestration |
| Node.js | 18.x+ | Lokális fejlesztéshez |

### Telepítés (Windows)

```powershell
# Docker Desktop telepítése
winget install Docker.DockerDesktop

# Ellenőrzés
docker --version
docker compose version
```

### Telepítés (Linux)

```bash
# Docker Engine
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose
sudo apt-get install docker-compose-plugin

# Felhasználó hozzáadása a docker csoporthoz
sudo usermod -aG docker $USER
```

---

## 📦 2. Dockerfile Készítése

### Alapvető Dockerfile

Hozd létre a `Dockerfile` fájlt a projekt gyökerében:

```dockerfile
# Dockerfile
FROM node:18-alpine

# Alapértelmezett munkakönyvtár
WORKDIR /app

# Csak a package fájlok másolása (cache optimalizáció)
COPY package*.json ./

# Függőségek telepítése
RUN npm ci --only=production

# Prisma schema másolása és client generálása
COPY prisma ./prisma
RUN npx prisma generate

# Alkalmazás kód másolása
COPY dist ./dist

# Port deklarálás
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Alkalmazás indítása
CMD ["node", "dist/server.js"]
```

### .dockerignore

Hozd létre a `.dockerignore` fájlt a felesleges fájlok kizárásához:

```dockerignore
# .dockerignore
node_modules
npm-debug.log
.git
.gitignore
.env
.env.*
*.md
!README.md
.vscode
.idea
coverage
.nyc_output
*.log
uploads/*
!uploads/.gitkeep
dist
tests
__tests__
*.test.ts
*.spec.ts
.eslintrc*
.prettierrc*
tsconfig.json
jest.config.js
scripts
```

---

## 🏗️ 3. Multi-Stage Build

A multi-stage build kisebb és biztonságosabb image-et eredményez:

```dockerfile
# Dockerfile.multistage

# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Függőségek telepítése (dev is, build-hez kell)
COPY package*.json ./
RUN npm ci

# Prisma setup
COPY prisma ./prisma
RUN npx prisma generate

# TypeScript fordítás
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ============================================
# Stage 2: Production Stage
# ============================================
FROM node:18-alpine AS production

# Biztonsági frissítések
RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Non-root user létrehozása
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nodejs

WORKDIR /app

# Csak production függőségek
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Prisma client másolása a builder-ből
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Build output másolása
COPY --from=builder /app/dist ./dist

# Jogosultságok beállítása
RUN chown -R nodejs:nodejs /app

# Non-root user-re váltás
USER nodejs

EXPOSE 3000

# Graceful shutdown támogatás
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

### Build Parancs

```bash
# Multi-stage build
docker build -f Dockerfile.multistage -t dual-backend:latest .

# Image méret ellenőrzése
docker images dual-backend
```

---

## 🐙 4. Docker Compose Környezet

### Fejlesztői Környezet

Hozd létre a `docker-compose.yml` fájlt:

```yaml
# docker-compose.yml
version: '3.8'

services:
  # ============================================
  # PostgreSQL Database
  # ============================================
  postgres:
    image: postgres:15-alpine
    container_name: dual-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: dual_user
      POSTGRES_PASSWORD: dual_password
      POSTGRES_DB: dual_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dual_user -d dual_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Redis (Rate Limiting, Cache, BullMQ)
  # ============================================
  redis:
    image: redis:7-alpine
    container_name: dual-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ============================================
  # Backend API
  # ============================================
  api:
    build:
      context: .
      dockerfile: Dockerfile.multistage
    container_name: dual-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://dual_user:dual_password@postgres:5432/dual_db?schema=public
      DIRECT_URL: postgresql://dual_user:dual_password@postgres:5432/dual_db?schema=public
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET:-change_this_in_production_min_32_chars}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost:3000}
      SMTP_HOST: ${SMTP_HOST:-sandbox.smtp.mailtrap.io}
      SMTP_PORT: ${SMTP_PORT:-2525}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: dual-network
```

### Production Compose (Többszörös Instance)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 1G
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 512M
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    image: dual-backend:${TAG:-latest}
    restart: always
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      rollback_config:
        parallelism: 1
        delay: 10s
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: ${FRONTEND_URL}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    deploy:
      resources:
        limits:
          memory: 128M

volumes:
  postgres_data:
  redis_data:
```

---

## 🔐 5. Környezeti Változók Kezelése

### .env.docker Fájl

Hozd létre a `.env.docker` fájlt (NE COMMITOLD!):

```env
# .env.docker

# Database
DB_USER=dual_user
DB_PASSWORD=strong_password_here
DB_NAME=dual_db

# Redis
REDIS_PASSWORD=redis_password_here

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Frontend
FRONTEND_URL=https://your-frontend-domain.com

# SMTP
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Image Tag
TAG=latest
```

### Docker Secrets (Biztonságosabb)

```yaml
# docker-compose.secrets.yml
version: '3.8'

services:
  api:
    secrets:
      - jwt_secret
      - db_password
      - redis_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  db_password:
    file: ./secrets/db_password.txt
  redis_password:
    file: ./secrets/redis_password.txt
```

---

## 🔄 6. Nginx Load Balancer

### Nginx Konfiguráció

Hozd létre az `nginx/nginx.conf` fájlt:

```nginx
# nginx/nginx.conf

worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging formátum
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Teljesítmény optimalizációk
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip tömörítés
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/rss+xml application/atom+xml image/svg+xml;

    # Rate limiting zóna
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    # Upstream (API instances)
    upstream api_servers {
        least_conn;  # Legkevesebb kapcsolathoz irányít
        
        server api:3000 weight=1 max_fails=3 fail_timeout=30s;
        # Docker Compose replicas esetén a DNS automatikusan feloldja
        
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Redirect to HTTPS (production)
        # return 301 https://$server_name$request_uri;

        location / {
            # Rate limiting
            limit_req zone=api_limit burst=20 nodelay;
            limit_conn conn_limit 10;

            # Proxy beállítások
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            
            # Headers
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            # Buffer beállítások
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 32k;
            proxy_busy_buffers_size 64k;
        }

        # Health check endpoint (belső használatra)
        location /nginx-health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }

        # Swagger UI statikus tartalom
        location /api-docs {
            proxy_pass http://api_servers;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }

    # HTTPS server (production)
    # server {
    #     listen 443 ssl http2;
    #     server_name your-domain.com;
    #
    #     ssl_certificate /etc/nginx/ssl/fullchain.pem;
    #     ssl_certificate_key /etc/nginx/ssl/privkey.pem;
    #     ssl_protocols TLSv1.2 TLSv1.3;
    #     ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    #     ssl_prefer_server_ciphers off;
    #
    #     # ... same location blocks as above
    # }
}
```

---

## 🚀 7. Build és Futtatás

### Fejlesztői Parancsok

```bash
# 1. Image build
docker build -t dual-backend:dev .

# 2. Konténerek indítása
docker compose up -d

# 3. Logok megtekintése
docker compose logs -f api

# 4. Konténerek állapota
docker compose ps

# 5. Leállítás
docker compose down

# 6. Teljes törlés (volumes-al együtt)
docker compose down -v
```

### Production Build és Deploy

```bash
# 1. Multi-stage production build
docker build -f Dockerfile.multistage -t dual-backend:1.0.0 .

# 2. Image tag-elése registry-hez
docker tag dual-backend:1.0.0 your-registry.com/dual-backend:1.0.0
docker tag dual-backend:1.0.0 your-registry.com/dual-backend:latest

# 3. Push registry-be
docker push your-registry.com/dual-backend:1.0.0
docker push your-registry.com/dual-backend:latest

# 4. Production indítás
docker compose -f docker-compose.prod.yml --env-file .env.docker up -d

# 5. Scaling
docker compose -f docker-compose.prod.yml up -d --scale api=5
```

### Prisma Migrálás Konténerben

```bash
# Egyszeri migráció futtatása
docker compose exec api npx prisma db push

# Vagy külön migráció konténer
docker compose run --rm api npx prisma migrate deploy
```

---

## ⚡ 8. Production Optimalizációk

### 8.1 Node.js Beállítások

```dockerfile
# Dockerfile kiegészítése
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=512"
```

### 8.2 PM2 Process Manager (Opcionális)

```dockerfile
# PM2-vel
FROM node:18-alpine

RUN npm install -g pm2

COPY ecosystem.config.js ./

CMD ["pm2-runtime", "ecosystem.config.js"]
```

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'dual-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

### 8.3 Image Biztonsági Scan

```bash
# Trivy scanner
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image dual-backend:latest

# Snyk scanner
snyk container test dual-backend:latest
```

### 8.4 Multi-Architecture Build

```bash
# Buildx létrehozása
docker buildx create --name multibuilder --use

# ARM64 és AMD64 build
docker buildx build --platform linux/amd64,linux/arm64 \
  -t dual-backend:latest --push .
```

---

## ☸️ 9. Kubernetes Deployment

### Deployment Manifest

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dual-backend
  labels:
    app: dual-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dual-backend
  template:
    metadata:
      labels:
        app: dual-backend
    spec:
      containers:
        - name: api
          image: your-registry.com/dual-backend:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: dual-backend-secrets
            - configMapRef:
                name: dual-backend-config
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: dual-backend-service
spec:
  selector:
    app: dual-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dual-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dual-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### ConfigMap és Secret

```yaml
# k8s/config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dual-backend-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  FRONTEND_URL: "https://your-frontend.com"
---
apiVersion: v1
kind: Secret
metadata:
  name: dual-backend-secrets
type: Opaque
stringData:
  JWT_SECRET: "your-jwt-secret"
  DATABASE_URL: "postgresql://..."
  REDIS_URL: "redis://..."
```

---

## 🔧 10. Troubleshooting

### Gyakori Problémák

| Probléma | Ok | Megoldás |
|:---------|:---|:---------|
| Container azonnal kilép | Prisma generate hiba | Build során futtasd a `prisma generate`-et |
| DB connection refused | Postgres még nem indult | Használj `depends_on` + `healthcheck` |
| Permission denied | Non-root user jogok | `chown` a megfelelő könyvtárakra |
| Memory limit exceeded | Node heap túl nagy | Állítsd be a `--max-old-space-size`-t |
| Slow startup | Nincs npm cache | Használj `.dockerignore` és layer cache-t |

### Hasznos Debug Parancsok

```bash
# Interaktív shell a konténerben
docker compose exec api sh

# Konténer logok
docker compose logs -f --tail=100 api

# Konténer erőforrás használat
docker stats

# Network inspect
docker network inspect dual-network

# Prisma Studio a konténerből
docker compose exec api npx prisma studio
```

### Health Check Endpoint

Győződj meg róla, hogy van `/health` endpoint:

```typescript
// src/routes/healthRoutes.ts
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

---

## 📁 Ajánlott Fájlstruktúra

```
dual-kepzes-backend/
├── Dockerfile              # Alapvető Dockerfile
├── Dockerfile.multistage   # Production multi-stage build
├── docker-compose.yml      # Fejlesztői környezet
├── docker-compose.prod.yml # Production környezet
├── .dockerignore          # Docker build kizárások
├── .env.docker            # Docker-specifikus env (NE COMMITOLD!)
├── nginx/
│   ├── nginx.conf         # Nginx konfiguráció
│   └── ssl/               # SSL tanúsítványok (production)
├── k8s/                   # Kubernetes manifesztek
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── config.yaml
│   └── ingress.yaml
└── scripts/
    └── docker-entrypoint.sh  # Egyedi entrypoint (opcionális)
```

---

## 📚 Kapcsolódó Dokumentáció

- [CONCURRENCY_PLAN.md](./CONCURRENCY_PLAN.md) - Konkurencia kezelési terv
- [README.md](./README.md) - Projekt áttekintés
- [handover.md](./handover.md) - Átadási dokumentáció
- [requirements_for_sysadmin.md](./requirements_for_sysadmin.md) - Infrastruktúra követelmények

---

> 📝 **Megjegyzés**: Ez a dokumentum a projekt 2026-02-03-i állapotára épül. A konkrét konfigurációkat a tényleges infrastruktúra és biztonsági követelmények alapján kell finomhangolni.
