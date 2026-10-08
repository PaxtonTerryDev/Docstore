# Docstore — MVP Plan

Internal document storage service: upload, search, view, download, audit. Files live in RustFS (S3-compatible), run locally via Docker Compose; metadata and audit live in Postgres.

## Architecture

```
Browser ──► apps/web (Next.js: UI + route handlers) ──► Postgres (metadata, audit, users)
   │                         │
   └── presigned URLs ───────┴──► RustFS (S3 API, compose)
```

- Single Next.js app. Route handlers are the API; no separate service.
- Browser uploads/downloads directly to RustFS via presigned URLs. The app never proxies file bytes.
- RustFS runs in the project's compose stack (based on `rustfs.compose.yml`) and is accessed only through the S3 API (`@aws-sdk/client-s3`) so the backend stays swappable.

## Repo layout

```
apps/web                 existing Next.js app (UI + API routes)
packages/ui              existing shadcn components
packages/db              new: Drizzle schema, client, migrations
packages/storage         new: S3 client wrapper (presign put/get, head, delete)
docker-compose.yml       postgres + rustfs + bucket init (+ web for full-stack runs)
rustfs.compose.yml       reference file; services get merged into docker-compose.yml
```

## Data model

`documents`
- `id` uuid pk
- `filename`, `content_type`, `size_bytes`
- `object_key` (unique), `sha256`
- `doc_type` (e.g. deed, mortgage, release, plat)
- `instrument_number`, `book`, `page`, `recorded_date`
- `status` (`pending` | `ready`)
- `uploaded_by`, `created_at`

`audit_log` (append-only)
- `id`, `at`, `user_id`, `action` (`upload` | `view` | `download` | `search`), `document_id` nullable, `ip`

`users` / `sessions`: minimal, see Auth.

## Flows

**Upload**
1. UI submits metadata + file name/type/size → `POST /api/documents`.
2. Server inserts row (`pending`), returns presigned PUT URL for `object_key = <uuid>/<filename>`.
3. Browser PUTs file to RustFS.
4. UI calls `POST /api/documents/:id/complete` → server `HEAD`s the object, verifies size, sets `ready`, writes audit entry.

**View / download**
1. `GET /api/documents/:id/url?disposition=inline|attachment`.
2. Server writes audit entry, returns short-lived (60s) presigned GET URL.
3. UI renders PDF/image inline (iframe/img) or triggers download.

**Search**
- `GET /api/documents?q=&type=&instrument=&from=&to=&page=` — Postgres query over metadata (ILIKE + filters). No full-text on file contents.

## UI (shadcn)

- `/login`
- `/documents` — search filters + results table, upload dialog
- `/documents/[id]` — metadata + preview + download
- `/audit` — filterable audit table

## Auth

Demo: single credentials login (seeded users, hashed passwords, session cookie). Pitch: swap for OIDC against the existing identity provider. Two roles: `admin` (sees audit) and `user`.

## Stack

- Next.js (existing), shadcn (existing `packages/ui`)
- Drizzle ORM + `postgres` driver
- `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
- Docker Compose for Postgres, RustFS, and the web container

## Config (env)

```
DATABASE_URL=postgres://docstore:docstore@localhost:5433/docstore  # host port 5433 (5432 is often taken)
S3_ENDPOINT=http://rustfs:9000          # server-side, compose network
S3_PUBLIC_ENDPOINT=http://localhost:9000 # host used in presigned URLs, must be browser-reachable
S3_REGION=us-east-1
S3_BUCKET=docstore
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_FORCE_PATH_STYLE=true
SESSION_SECRET=
```

## RustFS setup

- Take the `rustfs` service and `volume-permission-helper` from `rustfs.compose.yml` into `docker-compose.yml`. Ports: `9000` (S3), `9001` (console).
- Change `RUSTFS_ACCESS_KEY` / `RUSTFS_SECRET_KEY` from `rustfsadmin` via `.env`. Pin the image tag instead of `latest`.
- The compose file uses 4 volumes (`rustfs{0...3}`) for erasure coding; on a single physical disk RustFS refuses to start, so `RUSTFS_UNSAFE_BYPASS_DISK_CHECK=true` is set (confirmed required).
- Add a one-shot init service (e.g. `minio/mc` or an AWS CLI container) that creates the `docstore` bucket and a dedicated app access key, so a fresh `docker compose up` works.
- Presigned URLs embed the host in the signature, so presign with `S3_PUBLIC_ENDPOINT` (a second S3 client configured with that endpoint), not the internal `rustfs:9000`.
- Browser PUT/GET needs CORS on the S3 API (not just the console). `RUSTFS_CONSOLE_CORS_ALLOWED_ORIGINS` only covers the console. Verify RustFS's mechanism for S3 CORS (env var or `PutBucketCors`) during milestone 1.
- Console on `:9001` serves as the admin UI for the demo.

## Stages

Each stage ends with a check you can run before moving on. Priority is a polished, impressive UI; skip validation, hardening, and edge cases.

### Stage 1 — Infrastructure
- `docker-compose.yml` with Postgres, RustFS, bucket init.
- **Test:** `docker compose up` is healthy; console at `localhost:9001` shows the `docstore` bucket; `psql` connects.

### Stage 2 — Storage package
- `packages/storage`: internal client + public-endpoint presigner (put/get/head).
- **Test:** a script puts a file, fetches it via a presigned GET URL with `curl`, and uploads via presigned PUT.

### Stage 3 — CORS check
- Configure S3 CORS on RustFS.
- **Test:** a throwaway HTML page (or browser console `fetch`) PUTs a file to a presigned URL from `localhost:3000` without a CORS error.

### Stage 4 — Database
- `packages/db`: Drizzle schema, migrations, seed script (users + sample documents rows).
- **Test:** migrate + seed run clean; rows visible in `psql`.

### Stage 5 — Upload flow
- `POST /api/documents`, `/complete`, upload dialog.
- **Test:** upload a PDF from the UI; row is `ready`; object appears in the RustFS console.

### Stage 6 — List, search, view, download
- Documents table with filters, detail page with inline preview, download button.
- **Test:** search by instrument number and type returns expected rows; PDF and image preview render; download saves the original file.

### Stage 7 — Auth
- Login page, session cookie, route guard, seeded `admin` and `user`.
- **Test:** unauthenticated visit redirects to `/login`; both seeded users can sign in; only `admin` sees `/audit`.

### Stage 8 — Audit log
- Write entries on upload/view/download/search; audit page with filters.
- **Test:** perform each action, confirm one matching row appears in `/audit` with the right user and document.

### Stage 9 — Demo polish
- Visual pass (layout, empty/loading states, dashboard stats, animations), seed realistic sample documents, README run steps.
- **Test:** from a clean checkout, `docker compose up` + seed + `npm run dev` yields a ready-to-demo app.

## Out of scope (mention in pitch, don't build)

- Object Lock / WORM, versioning, retention policies
- Replication, backup, DR
- OIDC/SSO, fine-grained permissions
- OCR / content search, virus scanning
- BMI bulk migration tooling with checksum parity
- Rancher/k8s manifests

## Open questions

- RustFS version/maturity and Object Lock support (for the production pitch).
- How S3 CORS is configured in RustFS.
- For production: where RustFS gets deployed (Rancher) and with what disk topology.
- Real document types / metadata fields used by the Recorder's office.
