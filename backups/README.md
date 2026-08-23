# Original UI Prototype Backups

Created during Phase 1 (project structure), before any React conversion work
started. These four files are byte-for-byte copies of the original UI
prototypes exactly as supplied — verified with SHA-256 at copy time — and are
kept here unmodified for reference for the rest of the project.

| File | Identified as | Confirmed by |
|---|---|---|
| `Login.html` | Login | `<title>CricTalentAI — Sign In</title>`, single username/password form with show/hide password |
| `admin (4).html` | Admin Portal | Sidebar labels: Admin Management, Coach Management, Player Management, Tournament Management, Schedule Management, Reports (route title "Admin Dashboard") |
| `couch.html` | Coach Portal | `<title>CricTalentAI — Coach Portal with Record Management</title>` — filename is a spelling artifact, not a separate module |
| `player (4).html` | Player Portal | `<title>CricTalentAI – Player Portal</title>`, headings match all 9 FR8 pages (Dashboard, My Profile, My Match Statistics, My Training Records, My Schedule, My Goals, My Feedback, My Development Report, My Training Progress Status) |

These identifications were made by content, not filename, during the Phase 0
audit (see `docs/`).

**Do not edit these files.** The originals in the project root are also left
untouched. The working copies that get converted into React components live
in `frontend/` starting Phase 2.
