# Apache Solr job search

The public job listing (`GET /api/v1/jobs`) can be served by Apache Solr for
fast, indexed full-text search. Solr is **optional**: if `SOLR_URL` is not set,
or Solr is unreachable, the endpoint automatically falls back to a cached
MongoDB query, so the app keeps working either way.

## How it fits together

```
client write (create/update/status/delete)
        │
        ▼
   MongoDB (source of truth) ──► syncJobToSolr() ──► Solr `jobs` core
        ▲                                                  │
        │ fallback (cached)                                │ fast path
        └──────────────  GET /api/v1/jobs  ◄──────────────┘
```

- **MongoDB is always the source of truth.** Solr is a search index built from it.
- Writes update Mongo first, then push to Solr fire-and-forget — a Solr outage
  never blocks a job from being saved.
- `GET /jobs` uses Solr when it is configured *and* healthy (a 15s-cached ping),
  otherwise the cached Mongo path. The response includes a `source: "solr" | "mongo"`
  field so you can see which path served the request.

## Run Solr locally

```bash
# from backend/
docker compose -f docker-compose.solr.yml up -d
```

Then set in `backend/.env`:

```
SOLR_URL=http://localhost:8983/solr
SOLR_JOBS_CORE=jobs
```

## Backfill the index

```bash
npm run solr:reindex
```

This reads every active job from MongoDB, clears the Solr core, and re-indexes in
batches. Run it once after first starting Solr (and any time you suspect the
index has drifted). Day-to-day, the index stays in sync automatically via the
write hooks.

## Document schema

Documents use Solr's default dynamic-field suffixes, so the default config set
works with no manual schema changes:

| Field              | Type        | Purpose                              |
| ------------------ | ----------- | ------------------------------------ |
| `id`               | string (uk) | job `_id`                            |
| `title_t`          | text        | full-text, boosted ^3                |
| `company_t`        | text        | full-text, boosted ^2                |
| `skills_txt`       | text        | full-text, boosted ^1.5              |
| `location_t`       | text        | full-text + location filter          |
| `description_t`    | text        | full-text                            |
| `type_s`           | string      | exact employment-type filter         |
| `status_s`         | string      | always `active` (index is active-only) |
| `createdAt_dt`     | date        | sort newest-first                    |
| `payload_s`        | string      | full normalized job JSON (returned as-is) |

The full normalized job is stored in `payload_s`, so search results are returned
in the exact shape the API already produces — no second MongoDB read per result.
