# Data Contexts — Historical/Sample ML Data vs. Live Application Data

Agreed during Phase 0 planning corrections, before any Phase 1 structure was
created. This project deliberately keeps two separate data contexts. They
must never be joined or treated as the same records, even where they happen
to share an ID format such as `P001`.

## 1. Historical / Sample ML Data

- Files: `players.xlsx`, `match_performance.xlsx` (currently in the project
  root), and `training_records.xlsx` once it is generated (Phase 11).
- Purpose: training and evaluating the Performance Prediction model
  (Random Forest / XGBoost), the K-Means archetype clustering model, and
  validating the Training Recommendation logic.
- Scope: 56 sample/historical players (`P001`–`P056`), three seasons of
  match history (2023–2025).
- Used only inside: `ml/` notebooks and scripts, and the model-training step
  of `ai_service/` — never queried or joined by the live web application.
- Never imported wholesale into the live MySQL `Users` / `Players` / `Coaches`
  tables as though it were the current academy roster.

## 2. Live MySQL Application Data

- Tables: `Users`, `Players`, `Coaches`, and every live match, training,
  goal, feedback, tournament and report record the running CricTalentAI
  application creates and reads.
- Purpose: the actual academy application — the system an Admin, Coach or
  Player logs into and uses day to day.
- Seeded with a small, coherent demo identity set matching the existing UI
  prototypes: Player `P001` = **Kasun Perera** (age 18, Batter), Coach =
  **Ravi Jayasinghe**.
- Populated by the application itself, starting with `database/seed.sql` in
  Phase 3 — not derived from, or synchronised with, the historical ML
  dataset.

## The rule

An ID such as `P001` in the historical ML dataset and an ID such as `P001`
in the live MySQL `Players` table are two different, unrelated records, even
though the text matches. Code, reports, and documentation must never assume
otherwise. If a clearer separation is useful once the schema is designed
(Phase 3) — for example, giving the live `Players` table its own independent
primary key or a distinct code prefix — that decision is made then, but the
rule above holds regardless of the exact ID format chosen.
