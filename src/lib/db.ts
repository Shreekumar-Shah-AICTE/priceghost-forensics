import Database from "better-sqlite3";
import path from "path";

// Initialize local SQLite database
const dbPath = path.resolve(process.cwd(), "priceghost.db");
const db = new Database(dbPath);

// Enable WAL journal mode for optimal performance
db.pragma("journal_mode = WAL");

// Initialize database schema (7 Tables)
db.exec(`
  -- Table 1: scans (core domain)
  CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    target_description TEXT,
    scan_type TEXT DEFAULT 'url',
    status TEXT DEFAULT 'pending',
    total_geos INTEGER DEFAULT 10,
    completed_geos INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table 2: scan_results (per-geo results)
  CREATE TABLE IF NOT EXISTS scan_results (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    geo_profile_id TEXT NOT NULL REFERENCES geo_profiles(id),
    price_local REAL,
    currency TEXT,
    price_usd REAL,
    device_profile TEXT,
    raw_html_snippet TEXT,
    content_hash TEXT, -- SHA-256
    response_status INTEGER,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT
  );

  -- Table 3: geo_profiles (lookup table)
  CREATE TABLE IF NOT EXISTS geo_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    country_code TEXT NOT NULL,
    city TEXT NOT NULL,
    flag_emoji TEXT,
    gdp_per_capita REAL,
    timezone TEXT,
    is_active INTEGER DEFAULT 1
  );

  -- Table 4: discrimination_reports (computed statistics)
  CREATE TABLE IF NOT EXISTS discrimination_reports (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    gini_coefficient REAL,
    cv_percentage REAL,
    mann_whitney_u REAL,
    mann_whitney_p REAL,
    is_significant INTEGER,
    temporal_score REAL,
    discrimination_type TEXT,
    severity TEXT,
    ai_summary TEXT,
    computed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table 5: evidence_packages (forensic artifacts)
  CREATE TABLE IF NOT EXISTS evidence_packages (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    package_json TEXT NOT NULL,
    timestamp_chain TEXT,
    content_hashes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table 6: audit_log (activity tracking)
  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table 7: scan_schedules (TriggerWare automated workflows)
  CREATE TABLE IF NOT EXISTS scan_schedules (
    id TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    cron_expression TEXT,
    triggerware_workflow_id TEXT,
    is_active INTEGER DEFAULT 1,
    last_run_at DATETIME,
    next_run_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export default db;
