# Manari current temperature

The homepage widget reads `/api/weather`, a Cloudflare Pages Function. No account keys, database migration or visitor geolocation are required.

Location: municipal seat of Manari, Pernambuco, Brazil (`-8.96389, -37.62833`, `America/Recife`). Verified against the Open-Meteo geocoding entry whose `admin1` is Pernambuco and `admin2` is Manari; the distinct entry in Ibimirim is not used. IBGE municipal maps round the seat coordinates to `-8.96, -37.63`.

Source: https://open-meteo.com/en/docs and https://geocoding-api.open-meteo.com/v1/search?name=Manari&count=10&language=pt&format=json&countryCode=BR

Current `temperature_2m` is requested in Celsius with Unix timestamps, then displayed in Pernambuco time. This is model-estimated weather, not a local station observation or an INMET alert. Attribution is visible and linked. No severity level is inferred from the temperature.

The edge cache lasts 600 seconds. The homepage refreshes every ten minutes while visible and offers a manual refresh. Source requests time out after eight seconds. Data older than 90 minutes, wrong units, missing values or mismatched coordinates are rejected. Failure clears the temperature and shows unavailable; no fixed fallback reading is used.

`www/_routes.json` allows only the two existing visit-counter paths and the new weather endpoint paths. Both APIs are excluded from the service-worker cache. The SES-PE and INMET links and all existing department routes are preserved.

Run: `node --test tests/weather-now.test.mjs tests/visit-counter.test.mjs tests/climate-notice.test.cjs`.
