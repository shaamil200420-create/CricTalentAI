-- CricTalentAI Admin Backend — database schema (MySQL / WAMP)
--
-- You do NOT need to run this file by hand. FastAPI creates these same
-- tables automatically on startup (SQLAlchemy's Base.metadata.create_all())
-- against whatever database you point backend/.env at, and it never drops
-- or overwrites existing tables/data. It also auto-adds a couple of new
-- columns (matches.time, schedules.training_type) to an already-existing
-- database the first time it starts up after this update — see main.py.
--
-- This file exists so you can see the schema directly in phpMyAdmin, or
-- optionally run it yourself (e.g. via phpMyAdmin's "Import" or "SQL" tab)
-- to create the tables ahead of time in an empty crictalentai_db database.
-- If you do run it, run it once against a fresh/empty database — re-running
-- it against a database that already has these tables will fail on the
-- duplicate CREATE TABLE / CREATE INDEX statements (harmless — it just
-- means the schema already exists).
--
-- Matches backend/app/models.py exactly. See that file for field-by-field
-- comments on what each table backs in the Admin/Coach/Player frontend.

CREATE TABLE users (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	public_id VARCHAR(20) NOT NULL, 
	full_name VARCHAR(120) NOT NULL, 
	username VARCHAR(80) NOT NULL, 
	email VARCHAR(150), 
	phone VARCHAR(40), 
	specialization VARCHAR(120), 
	password_hash VARCHAR(255) NOT NULL, 
	`role` VARCHAR(10) NOT NULL, 
	is_active BOOL NOT NULL, 
	created_at DATETIME NOT NULL, 
	PRIMARY KEY (id)
);
CREATE UNIQUE INDEX ix_users_public_id ON users (public_id);
CREATE UNIQUE INDEX ix_users_username ON users (username);
CREATE INDEX ix_users_id ON users (id);
CREATE UNIQUE INDEX ix_users_email ON users (email);

CREATE TABLE player_profiles (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	user_id INTEGER NOT NULL, 
	age INTEGER, 
	player_role VARCHAR(30), 
	batting_style VARCHAR(60), 
	bowling_style VARCHAR(60), 
	height_cm INTEGER, 
	weight_kg INTEGER, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id)
);
CREATE INDEX ix_player_profiles_id ON player_profiles (id);

CREATE TABLE tournaments (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	public_id VARCHAR(20) NOT NULL, 
	name VARCHAR(150) NOT NULL, 
	format VARCHAR(10) NOT NULL, 
	start_date DATE, 
	end_date DATE, 
	teams INTEGER NOT NULL, 
	status VARCHAR(20) NOT NULL, 
	PRIMARY KEY (id)
);
CREATE INDEX ix_tournaments_id ON tournaments (id);
CREATE UNIQUE INDEX ix_tournaments_public_id ON tournaments (public_id);

CREATE TABLE matches (
	id INTEGER NOT NULL AUTO_INCREMENT, 
	public_id VARCHAR(20) NOT NULL, 
	opponent VARCHAR(150) NOT NULL, 
	date DATE, 
	time TIME, 
	venue VARCHAR(150), 
	format VARCHAR(10) NOT NULL, 
	tournament_id INTEGER, 
	status VARCHAR(20) NOT NULL, 
	result VARCHAR(20), 
	PRIMARY KEY (id), 
	FOREIGN KEY(tournament_id) REFERENCES tournaments (id)
);
CREATE INDEX ix_matches_id ON matches (id);
CREATE UNIQUE INDEX ix_matches_public_id ON matches (public_id);

CREATE TABLE schedules (
	id INTEGER NOT NULL AUTO_INCREMENT,
	public_id VARCHAR(20) NOT NULL,
	kind VARCHAR(10) NOT NULL,
	title VARCHAR(150) NOT NULL,
	training_type VARCHAR(20),
	date DATE,
	time TIME,
	venue VARCHAR(150),
	status VARCHAR(20) NOT NULL,
	PRIMARY KEY (id)
);
CREATE INDEX ix_schedules_id ON schedules (id);
CREATE UNIQUE INDEX ix_schedules_public_id ON schedules (public_id);

-- Coach -> Match Entry (create) / Match Records (view, edit, remove). One
-- row per (player_id, match_id) — see MatchPerformance in models.py for the
-- full field-by-field explanation, including the Did-Not-Bat/Did-Not-Bowl
-- NULL convention and why strike_rate/boundary_runs/economy_rate/
-- fielding_score are always server-computed, never client-supplied.
CREATE TABLE match_performance (
	id INTEGER NOT NULL AUTO_INCREMENT,
	public_id VARCHAR(20) NOT NULL,
	player_id INTEGER NOT NULL,
	match_id INTEGER NOT NULL,
	batting_position INTEGER,
	runs INTEGER,
	balls_faced INTEGER,
	dismissal_type VARCHAR(20) NOT NULL,
	fours INTEGER,
	sixes INTEGER,
	strike_rate FLOAT,
	boundary_runs INTEGER,
	overs_bowled VARCHAR(10),
	runs_conceded INTEGER,
	wickets INTEGER,
	maidens INTEGER,
	dot_balls INTEGER,
	wides INTEGER,
	no_balls INTEGER,
	economy_rate FLOAT,
	catches INTEGER NOT NULL,
	dropped_catches INTEGER NOT NULL,
	run_outs INTEGER NOT NULL,
	stumpings INTEGER NOT NULL,
	misfields INTEGER NOT NULL,
	fielding_score INTEGER NOT NULL,
	notes TEXT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (player_id, match_id),
	FOREIGN KEY(player_id) REFERENCES users (id),
	FOREIGN KEY(match_id) REFERENCES matches (id)
);
CREATE INDEX ix_match_performance_id ON match_performance (id);
CREATE UNIQUE INDEX ix_match_performance_public_id ON match_performance (public_id);

-- Coach -> Training Entry (create) / Player -> My Training Records (view
-- own only). One row per (player_id, schedule_id) — schedule_id points at
-- an existing Training-kind row in `schedules`, never a second session
-- system. See TrainingRecord in models.py for full field comments.
CREATE TABLE training_records (
	id INTEGER NOT NULL AUTO_INCREMENT,
	public_id VARCHAR(20) NOT NULL,
	player_id INTEGER NOT NULL,
	schedule_id INTEGER NOT NULL,
	attendance VARCHAR(10) NOT NULL,
	drills_assigned INTEGER,
	drills_completed INTEGER,
	batting_practice INTEGER,
	bowling_practice INTEGER,
	fielding_score INTEGER,
	fitness_score INTEGER,
	coach_rating INTEGER,
	notes TEXT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	UNIQUE (player_id, schedule_id),
	FOREIGN KEY(player_id) REFERENCES users (id),
	FOREIGN KEY(schedule_id) REFERENCES schedules (id)
);
CREATE INDEX ix_training_records_id ON training_records (id);
CREATE UNIQUE INDEX ix_training_records_public_id ON training_records (public_id);

-- Coach -> Goal Tracking (create/manage) / Player -> My Goals (view own
-- only). A short-term, Coach-set goal for an existing Player. See
-- PlayerGoal in models.py for full field comments.
CREATE TABLE player_goals (
	id INTEGER NOT NULL AUTO_INCREMENT,
	public_id VARCHAR(20) NOT NULL,
	player_id INTEGER NOT NULL,
	coach_id INTEGER,
	focus_area VARCHAR(150) NOT NULL,
	target VARCHAR(255),
	deadline DATE,
	progress_pct INTEGER NOT NULL,
	status VARCHAR(20) NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(player_id) REFERENCES users (id),
	FOREIGN KEY(coach_id) REFERENCES users (id)
);
CREATE INDEX ix_player_goals_id ON player_goals (id);
CREATE UNIQUE INDEX ix_player_goals_public_id ON player_goals (public_id);

-- Coach -> Development Plan (create/manage) / Player -> My Development
-- Report (view own only). See PlayerDevelopmentPlan in models.py for full
-- field comments.
CREATE TABLE player_development_plans (
	id INTEGER NOT NULL AUTO_INCREMENT,
	public_id VARCHAR(20) NOT NULL,
	player_id INTEGER NOT NULL,
	coach_id INTEGER,
	focus_area VARCHAR(150) NOT NULL,
	objective TEXT,
	start_date DATE,
	target_date DATE,
	progress_pct INTEGER NOT NULL,
	status VARCHAR(20) NOT NULL,
	notes TEXT,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(player_id) REFERENCES users (id),
	FOREIGN KEY(coach_id) REFERENCES users (id)
);
CREATE INDEX ix_player_development_plans_id ON player_development_plans (id);
CREATE UNIQUE INDEX ix_player_development_plans_public_id ON player_development_plans (public_id);

-- Coach -> Player feedback notes (Coach -> Player List detail modal's
-- Feedback tab) / Player -> My Feedback (view own, PLAYER_VISIBLE only).
-- See PlayerFeedback in models.py for full field comments.
CREATE TABLE player_feedback (
	id INTEGER NOT NULL AUTO_INCREMENT,
	public_id VARCHAR(20) NOT NULL,
	player_id INTEGER NOT NULL,
	coach_id INTEGER,
	text TEXT NOT NULL,
	strengths VARCHAR(255),
	areas_to_improve VARCHAR(255),
	visibility VARCHAR(20) NOT NULL,
	created_at DATETIME NOT NULL,
	updated_at DATETIME NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(player_id) REFERENCES users (id),
	FOREIGN KEY(coach_id) REFERENCES users (id)
);
CREATE INDEX ix_player_feedback_id ON player_feedback (id);
CREATE UNIQUE INDEX ix_player_feedback_public_id ON player_feedback (public_id);

