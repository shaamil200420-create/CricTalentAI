# database/

MySQL/WAMP schema and seed scripts: `schema.sql` and `seed.sql`, designed to
be imported through phpMyAdmin and run by FastAPI/SQLAlchemy against the same
MySQL instance. Added in Phase 3 (MySQL / WAMP Database).

The live application's seed data uses a coherent demo identity (Player P001 =
Kasun Perera, Coach = Ravi Jayasinghe) — separate from the historical/sample
ML dataset (`players.xlsx`, `match_performance.xlsx`). See
`docs/DATA_CONTEXTS.md` for why these are kept apart.

Empty in Phase 1.
