# Portal visit counter

- Pages Function: `/api/visits` (`GET` reads; same-origin `POST` registers a visit).
- Production Pages binding: `VISITS_DB` → D1 `manari-portal-visits`.
- Database ID: `2fd6ac72-4e3a-48d4-a7e6-62a2c1577bf0`.
- Initialize a new database with `schema.sql` before deploying the function.
- The total starts at zero on activation. No historical totals are inferred.
- A secure HttpOnly random cookie is shared by the root domain and `www`. Reopening or reloading pages within 30 minutes refreshes the same visit, without increasing the total. The cookie is not an account identifier. No IP, contact details or path history are saved in this database.
- The database trigger increments the shared total atomically when a new anonymous session is inserted. Session rows older than 24 hours are removed in bounded batches, preserving the total.
- Preview hosts do not register visits. Known crawler user agents do not increment the total.
- This is a count of visits, not verified unique human beings; visitors clearing cookies and unidentified automation can affect the count.
- API failure is displayed as unavailable, never as a made-up zero. The API is excluded from the service-worker cache.
- Test locally with Node 24+: `node --test tests/visit-counter.test.mjs`. Tests use an in-memory SQLite database and never modify production visitor counts.
