# DocStore

Document upload and storage proof of concept. Next.js + Postgres + RustFS (S3-compatible). Files go straight from the browser to RustFS via presigned URLs.

## Run

```bash
cp .env.example .env
npm install
docker compose up -d
npm run migrate -w @workspace/db
npm run seed -w @workspace/db
npm run dev
```

Open http://localhost:3000

| Account | Email | Password |
| --- | --- | --- |
| Admin (sees the Activity log) | admin@docstore.local | admin123 |
| User | user@docstore.local | user123 |

RustFS console: http://localhost:9001 (docstoreadmin / docstoreadmin)

`seed` resets users, documents and the activity log, and uploads 30 sample PDFs to RustFS.
