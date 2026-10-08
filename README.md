# DocStore

Document upload and storage proof of concept. Next.js + Postgres + RustFS (S3-compatible). Files go straight from the browser to RustFS via presigned URLs.

## Run

```bash
cp .env.example .env
make setup
make dev
```

Open http://localhost:3000

Other targets: `make up`, `make down`, `make migrate`, `make seed`, `make build`, `make lint`, `make typecheck`.

| Account | Email | Password |
| --- | --- | --- |
| Admin (sees the Activity log) | admin@docstore.local | admin123 |
| User | user@docstore.local | user123 |

RustFS console: http://localhost:9001 (docstoreadmin / docstoreadmin)

`seed` resets users, documents and the activity log, and uploads 30 sample PDFs to RustFS.
