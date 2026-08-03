# 🚀 PROJECT SPECIFICATION & ARCHITECTURE DOCUMENT
## Single-Prompt Minimalist Budget Tracker (PWA & iOS Mobile App)

---

## 📌 Executive Summary
This document outlines the end-to-end technical specifications, architecture, security standards, and deployment strategy for **SpendSnap** (working title) — a ultra-minimalist, single-purpose budget tracking system. 

The core design philosophy is **Zero Friction**: eliminating traditional multi-step forms by converting natural language inputs (e.g., *"Taxi 150"*, *"Yesterday dinner with friends 1200 tl"*, *"AWS $10"*) into structured financial transactions in real-time.

The project is designed as an **Offline-First Decoupled Full-Stack System**, targetable for both Web (PWA) and iOS (App Store via Capacitor wrapper).

---

## 🛠️ Tech Stack & Ecosystem

### 1. Frontend (Web & Mobile Shell)
* **Framework:** Next.js 14+ (App Router) with TypeScript (Strict mode enabled).
* **UI & Styling:** Tailwind CSS, Framer Motion (for real-time micro-animations).
* **State Management:** Zustand with `persist` middleware (IndexedDB / LocalStorage backup).
* **PWA & Offline:** Serwist / `@ducanh2912/next-pwa` (Service Workers, Cache-First strategy for static assets, Background Sync for queued transactions).
* **Native Mobile Wrapper:** `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`.

### 2. Backend (API & Business Logic)
* **Runtime & Framework:** Node.js (v20+ LTS), Express.js with TypeScript.
* **Architecture:** Decoupled RESTful API (Clean / Layered Architecture: Controllers -> Services -> Repositories).
* **Database ORM:** Drizzle ORM (Type-safe, low latency SQL driver).
* **API Documentation:** OpenAPI / Swagger.

### 3. Database & Caching
* **Primary Database:** PostgreSQL 16 (Relational DB for users, transactions, accounts, and exchange rates).
* **Caching & Queue Layer:** Redis 7 (Session store, daily exchange rate cache, sync queue throttling).

### 4. DevOps & Infrastructure
* **Containerization:** Docker & Docker Compose (Multi-container architecture).
* **Reverse Proxy & SSL:** Nginx (Rate limiting, SSL termination, CORS management).

---

## 🏗️ System Architecture & Data Flow

```
[ iOS App Store Build (Capacitor) / Web PWA ]
                      │
   Offline Storage: Zustand + IndexedDB (0ms UI latency)
                      │
           (Background Sync Queue)
                      │
             [ Nginx Reverse Proxy ]
                      │
         ┌────────────┴────────────┐
         ▼                         ▼
 [ Next.js Frontend ]    [ Node.js Express API ]
 (SSR Landing / SPA)    (Auth, Parsing Engine, Sync)
                                   │
                         ┌─────────┴─────────┐
                         ▼                   ▼
                   [ PostgreSQL ]        [ Redis ]
                   (Transactional)     (Rate Cache)
```

---

## 💡 Core Features & Functional Requirements

### 1. Zero-Friction Input & Real-Time Parser Engine
* Single input box with automatic keyboard focus (`autofocus`) on application load.
* **Regex & Heuristic Parsing Engine (`TextParserService`):**
  * **Amount Extraction:** Identifies numbers, decimals (`.`, `,`), and currency indicators (`₺`, `$`, `€`, `TL`, `USD`, `EUR`).
  * **Temporal Parsing:** Detects keywords such as *"today"*, *"yesterday"*, *"dün"*, *"geçen cuma"*, adjusting transaction timestamps dynamically.
  * **Description Parsing:** Sanitizes remaining tokens to form clean transaction labels.
  * **Fallback Handling:** If only a number is provided (e.g., `"450"`), tag description as `"Other/General"` and highlight for user tap-to-edit.

### 2. Multi-Currency & Real-Time Conversion
* Primary user base currency configuration (e.g., TRY).
* Automatic conversion of foreign currencies (e.g., `$10 AWS`) using daily cached exchange rates stored in Redis.
* Dual currency display on expense ledgers: Original currency + Converted base amount.

### 3. Offline-First Synchronization (PWA & iOS)
* All transactions write immediately to the local device database (`IndexedDB`).
* Background Worker checks network status (`navigator.onLine`).
* Batched requests send pending local transactions to `/api/v1/expenses/sync` upon reconnection.
* Conflict resolution: **Server-timestamp priority with Client ID deduplication**.

---

## 🔒 Security Architecture & Vulnerability Mitigations

### 1. Authentication & Authorization
* **Dual Token System:** JWT Short-lived Access Tokens (15 min) + Refresh Tokens stored in `HttpOnly`, `SameSite=Strict`, `Secure` cookies.
* **OAuth 2.0 Integration:** Google Login & Sign in with Apple (Mandatory requirement for Apple App Store Review Guidelines Section 4.8).
* **Password Hashing:** Argon2id or bcrypt (salt rounds: 12).

### 2. Security Countermeasures
* **Input Sanitization:** Sanitize all incoming text string parsing inputs against Cross-Site Scripting (XSS) using `DOMPurify` / server-side regex escaping.
* **SQL Injection:** Exclusively use Drizzle ORM parameterized queries; raw string concatenation is strictly banned.
* **CORS Policy:** Strict origin checks configured in Nginx & Express (`Access-Control-Allow-Origin` set explicitly to domain/app scheme, no `*`).
* **Rate Limiting:** `express-rate-limit` + Redis store.
  * `/api/v1/auth/*`: Max 5 requests per minute per IP.
  * `/api/v1/parse/*`: Max 60 requests per minute per user.
* **Mobile iOS App Security:** 
  * Enforce HTTPS (TLS 1.3) via iOS App Transport Security (ATS).
  * Prevent web text selection (`-webkit-user-select: none`) and image callouts (`-webkit-touch-callout: none`).

---

## 📱 iOS App Store Compliance & PWA Optimization Checklist

To satisfy **Apple App Store Review Guidelines (Section 4.2 Minimum Functionality)**:

1. **Safe Area Management:**
   ```css
   .app-header { padding-top: env(safe-area-inset-top); }
   .app-footer { padding-bottom: env(safe-area-inset-bottom); }
   ```
2. **Native iOS UX Touches:**
   * Disable web pull-to-refresh overscroll elastictiy: `overscroll-behavior-y: contain`.
   * Haptic feedback integration via `@capacitor/haptics` on expense submission.
   * Native share integration via `@capacitor/share`.
3. **Capacitor Build Flow:**
   ```bash
   # Next.js Static Export Config
   # next.config.js -> output: 'export'
   npm run build
   npx cap copy ios
   npx cap open ios
   ```

---

## 🐳 Docker Deployment & Environment Setup

### `docker-compose.yml` Structure

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: spend_postgres
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: spend_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app_net

  redis:
    image: redis:7-alpine
    container_name: spend_redis
    restart: always
    networks:
      - app_net

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: spend_backend
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/spend_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - app_net

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: spend_frontend
    restart: always
    networks:
      - app_net

  nginx:
    image: nginx:alpine
    container_name: spend_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
      - ./nginx/certs:/etc/nginx/certs
    depends_on:
      - frontend
      - backend
    networks:
      - app_net

volumes:
  postgres_data:

networks:
  app_net:
    driver: bridge
```

---

## 📂 Repository Directory Layout (Monorepo)

```text
spend-snap/
├── .github/
│   └── workflows/ci-cd.yml
├── docker-compose.yml
├── nginx/
│   └── default.conf
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   │   └── textParser.service.ts
│   │   ├── db/
│   │   │   ├── schema.ts
│   │   │   └── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimiter.middleware.ts
│   │   └── index.ts
frontend/
│   ├── Dockerfile
│   ├── capacitor.config.json
│   ├── package.json
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── BudgetGauge.tsx
│   │   │   ├── RealtimeParserInput.tsx
│   │   │   └── TransactionList.tsx
│   │   ├── store/
│   │   │   └── useBudgetStore.ts
│   │   └── lib/
│   │       └── syncEngine.ts
```

---

## 🎯 Prompts & Instructions for Codex / LLM Execution

When prompting Codex to build modules based on this document, follow these exact guidelines:
1. **Always use TypeScript strict mode.** No `any` types allowed.
2. **Prioritize Offline-First in UI Components.** State changes must reflect immediately in Zustand local store before dispatching HTTP requests to Backend API.
3. **Keep UI Minimalist.** Follow modern iOS HIG (Human Interface Guidelines): clean typography, muted palette, high contrast focus states, no unnecessary decorations.
