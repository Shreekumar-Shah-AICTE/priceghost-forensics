const Database = require("better-sqlite3");
const path = require("path");
const crypto = require("crypto");

const dbPath = path.resolve(__dirname, "../priceghost.db");
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

// Initialize database schema (7 Tables) directly inside seeder to guarantee existence
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

// Helper to generate IDs
const uuid = () => crypto.randomUUID();

// 1. Seed Geo Profiles (10 Locations)
const geoProfiles = [
  { id: "geo_mumbai", name: "Mumbai, India", country_code: "IN", city: "Mumbai", flag_emoji: "🇮🇳", gdp_per_capita: 2500, timezone: "Asia/Kolkata" },
  { id: "geo_newyork", name: "New York, USA", country_code: "US", city: "New York", flag_emoji: "🇺🇸", gdp_per_capita: 80000, timezone: "America/New_York" },
  { id: "geo_london", name: "London, UK", country_code: "GB", city: "London", flag_emoji: "🇬🇧", gdp_per_capita: 48000, timezone: "Europe/London" },
  { id: "geo_tokyo", name: "Tokyo, Japan", country_code: "JP", city: "Tokyo", flag_emoji: "🇯🇵", gdp_per_capita: 34000, timezone: "Asia/Tokyo" },
  { id: "geo_berlin", name: "Berlin, Germany", country_code: "DE", city: "Berlin", flag_emoji: "🇩🇪", gdp_per_capita: 50000, timezone: "Europe/Berlin" },
  { id: "geo_sydney", name: "Sydney, Australia", country_code: "AU", city: "Sydney", flag_emoji: "🇦🇺", gdp_per_capita: 65000, timezone: "Australia/Sydney" },
  { id: "geo_lagos", name: "Lagos, Nigeria", country_code: "NG", city: "Lagos", flag_emoji: "🇳🇬", gdp_per_capita: 2200, timezone: "Africa/Lagos" },
  { id: "geo_buenosaires", name: "Buenos Aires, Argentina", country_code: "AR", city: "Buenos Aires", flag_emoji: "🇦🇷", gdp_per_capita: 13000, timezone: "America/Argentina/Buenos_Aires" },
  { id: "geo_dubai", name: "Dubai, UAE", country_code: "AE", city: "Dubai", flag_emoji: "🇦🇪", gdp_per_capita: 52000, timezone: "Asia/Dubai" },
  { id: "geo_singapore", name: "Singapore", country_code: "SG", city: "Singapore", flag_emoji: "🇸🇬", gdp_per_capita: 82000, timezone: "Asia/Singapore" }
];

console.log("Seeding geo profiles...");
db.prepare("DELETE FROM geo_profiles").run();
const insertGeo = db.prepare(`
  INSERT INTO geo_profiles (id, name, country_code, city, flag_emoji, gdp_per_capita, timezone, is_active)
  VALUES (@id, @name, @country_code, @city, @flag_emoji, @gdp_per_capita, @timezone, 1)
`);

db.transaction(() => {
  for (const profile of geoProfiles) {
    insertGeo.run(profile);
  }
})();
console.log(`Seeded ${geoProfiles.length} geo profiles successfully.`);

// 2. Seed Pre-computed Scans (5 diagnostics)
const scans = [
  {
    id: "scan_flight_mumbai_london",
    target_url: "https://www.qatarairways.com/flights/mumbai-to-london",
    target_description: "Qatar Airways QR-556 - Economy Class (Coordinated Global Scan)",
    scan_type: "url",
    status: "completed",
    total_geos: 10,
    completed_geos: 10
  },
  {
    id: "scan_hotel_marriott_nyc",
    target_url: "https://www.marriott.com/hotels/travel/nycmq-new-york-marriott-marquis/",
    target_description: "Marriott Marquis Times Square - King Room (Simultaneous Search)",
    scan_type: "url",
    status: "completed",
    total_geos: 10,
    completed_geos: 10
  },
  {
    id: "scan_shoes_amazon_nike",
    target_url: "https://www.amazon.com/Nike-Air-Max-270-Running",
    target_description: "Nike Air Max 270 Black/White Edition (Retail Markup Analysis)",
    scan_type: "url",
    status: "completed",
    total_geos: 10,
    completed_geos: 10
  },
  {
    id: "scan_booking_paris_apartment",
    target_url: "https://www.booking.com/hotel/fr/paris-luxury-loft.html",
    target_description: "Eiffel Tower View Penthouse - 4 Nights (Surcharge Audit)",
    scan_type: "url",
    status: "completed",
    total_geos: 10,
    completed_geos: 10
  },
  {
    id: "scan_uber_lax_dtla",
    target_url: "https://www.uber.com/ride/lax-to-downtown",
    target_description: "Uber UberX - LAX International to Downtown LA (Location Surcharge)",
    scan_type: "url",
    status: "completed",
    total_geos: 10,
    completed_geos: 10
  }
];

// Helper to make mock result
const makeMockResult = (scanId, geoId, priceUsd, localCurrency, rate, device) => {
  const hash = crypto.createHash("sha256").update(`${scanId}-${geoId}-${priceUsd}`).digest("hex");
  const priceLocal = Math.round(priceUsd * rate * 100) / 100;
  return {
    id: `res_${scanId}_${geoId}`,
    scan_id: scanId,
    geo_profile_id: geoId,
    price_local: priceLocal,
    currency: localCurrency,
    price_usd: priceUsd,
    device_profile: device,
    raw_html_snippet: `<div class="price-container"><span class="price-symbol">${localCurrency}</span><span class="price-amount">${priceLocal}</span></div>`,
    content_hash: hash,
    response_status: 200,
    error_message: null
  };
};

const scanResults = {
  scan_flight_mumbai_london: [
    { geo: "geo_mumbai", usd: 455, cur: "INR", rate: 83.5, dev: "Windows 11 / Edge" },
    { geo: "geo_singapore", usd: 460, cur: "SGD", rate: 1.35, dev: "MacBook Pro / Safari" },
    { geo: "geo_lagos", usd: 490, cur: "NGN", rate: 1450, dev: "Samsung S24 / Chrome" },
    { geo: "geo_buenosaires", usd: 480, cur: "ARS", rate: 890, dev: "iPhone 15 / Safari" },
    { geo: "geo_tokyo", usd: 510, cur: "JPY", rate: 156, dev: "Windows 11 / Firefox" },
    { geo: "geo_berlin", usd: 520, cur: "EUR", rate: 0.92, dev: "Linux / Firefox" },
    { geo: "geo_dubai", usd: 580, cur: "AED", rate: 3.67, dev: "iPhone 15 / Safari" },
    { geo: "geo_sydney", usd: 590, cur: "AUD", rate: 1.51, dev: "MacBook Pro / Safari" },
    { geo: "geo_london", usd: 685, cur: "GBP", rate: 0.79, dev: "MacBook Pro / Safari" },
    { geo: "geo_newyork", usd: 682, cur: "USD", rate: 1.0, dev: "Windows 11 / Chrome" }
  ],
  scan_hotel_marriott_nyc: [
    { geo: "geo_mumbai", usd: 310, cur: "INR", rate: 83.5, dev: "Windows 11 / Edge" },
    { geo: "geo_lagos", usd: 315, cur: "NGN", rate: 1450, dev: "Samsung S24 / Chrome" },
    { geo: "geo_buenosaires", usd: 320, cur: "ARS", rate: 890, dev: "iPhone 15 / Safari" },
    { geo: "geo_tokyo", usd: 360, cur: "JPY", rate: 156, dev: "Windows 11 / Firefox" },
    { geo: "geo_berlin", usd: 380, cur: "EUR", rate: 0.92, dev: "Linux / Firefox" },
    { geo: "geo_singapore", usd: 420, cur: "SGD", rate: 1.35, dev: "MacBook Pro / Safari" },
    { geo: "geo_sydney", usd: 440, cur: "AUD", rate: 1.51, dev: "MacBook Pro / Safari" },
    { geo: "geo_dubai", usd: 460, cur: "AED", rate: 3.67, dev: "iPhone 15 / Safari" },
    { geo: "geo_london", usd: 510, cur: "GBP", rate: 0.79, dev: "MacBook Pro / Safari" },
    { geo: "geo_newyork", usd: 520, cur: "USD", rate: 1.0, dev: "Windows 11 / Chrome" }
  ],
  scan_shoes_amazon_nike: [
    { geo: "geo_mumbai", usd: 120, cur: "INR", rate: 83.5, dev: "Windows 11 / Edge" },
    { geo: "geo_lagos", usd: 122, cur: "NGN", rate: 1450, dev: "Samsung S24 / Chrome" },
    { geo: "geo_buenosaires", usd: 125, cur: "ARS", rate: 890, dev: "iPhone 15 / Safari" },
    { geo: "geo_tokyo", usd: 130, cur: "JPY", rate: 156, dev: "Windows 11 / Firefox" },
    { geo: "geo_berlin", usd: 145, cur: "EUR", rate: 0.92, dev: "Linux / Firefox" },
    { geo: "geo_singapore", usd: 140, cur: "SGD", rate: 1.35, dev: "MacBook Pro / Safari" },
    { geo: "geo_sydney", usd: 142, cur: "AUD", rate: 1.51, dev: "MacBook Pro / Safari" },
    { geo: "geo_dubai", usd: 150, cur: "AED", rate: 3.67, dev: "iPhone 15 / Safari" },
    { geo: "geo_london", usd: 165, cur: "GBP", rate: 0.79, dev: "MacBook Pro / Safari" },
    { geo: "geo_newyork", usd: 160, cur: "USD", rate: 1.0, dev: "Windows 11 / Chrome" }
  ],
  scan_booking_paris_apartment: [
    { geo: "geo_mumbai", usd: 750, cur: "INR", rate: 83.5, dev: "Windows 11 / Edge" },
    { geo: "geo_lagos", usd: 760, cur: "NGN", rate: 1450, dev: "Samsung S24 / Chrome" },
    { geo: "geo_buenosaires", usd: 780, cur: "ARS", rate: 890, dev: "iPhone 15 / Safari" },
    { geo: "geo_tokyo", usd: 850, cur: "JPY", rate: 156, dev: "Windows 11 / Firefox" },
    { geo: "geo_berlin", usd: 900, cur: "EUR", rate: 0.92, dev: "Linux / Firefox" },
    { geo: "geo_singapore", usd: 950, cur: "SGD", rate: 1.35, dev: "MacBook Pro / Safari" },
    { geo: "geo_sydney", usd: 980, cur: "AUD", rate: 1.51, dev: "MacBook Pro / Safari" },
    { geo: "geo_dubai", usd: 1100, cur: "AED", rate: 3.67, dev: "iPhone 15 / Safari" },
    { geo: "geo_london", usd: 1250, cur: "GBP", rate: 0.79, dev: "MacBook Pro / Safari" },
    { geo: "geo_newyork", usd: 1300, cur: "USD", rate: 1.0, dev: "Windows 11 / Chrome" }
  ],
  scan_uber_lax_dtla: [
    { geo: "geo_mumbai", usd: 42, cur: "INR", rate: 83.5, dev: "Windows 11 / Edge" },
    { geo: "geo_lagos", usd: 43, cur: "NGN", rate: 1450, dev: "Samsung S24 / Chrome" },
    { geo: "geo_buenosaires", usd: 45, cur: "ARS", rate: 890, dev: "iPhone 15 / Safari" },
    { geo: "geo_tokyo", usd: 52, cur: "JPY", rate: 156, dev: "Windows 11 / Firefox" },
    { geo: "geo_berlin", usd: 58, cur: "EUR", rate: 0.92, dev: "Linux / Firefox" },
    { geo: "geo_singapore", usd: 62, cur: "SGD", rate: 1.35, dev: "MacBook Pro / Safari" },
    { geo: "geo_sydney", usd: 68, cur: "AUD", rate: 1.51, dev: "MacBook Pro / Safari" },
    { geo: "geo_dubai", usd: 72, cur: "AED", rate: 3.67, dev: "iPhone 15 / Safari" },
    { geo: "geo_london", usd: 85, cur: "GBP", rate: 0.79, dev: "MacBook Pro / Safari" },
    { geo: "geo_newyork", usd: 88, cur: "USD", rate: 1.0, dev: "Windows 11 / Chrome" }
  ]
};

const discriminationReports = [
  {
    scan_id: "scan_flight_mumbai_london",
    gini: 0.124,
    cv: 16.4,
    mwu_u: 4.5,
    mwu_p: 0.003,
    is_significant: 1,
    temporal: 8.2,
    type: "Geographic Discrimination",
    severity: "Severe",
    summary: "Forensic analysis confirms statistically significant geographical pricing discrimination (p = 0.003). Users booking from New York and London are penalized with markup surcharges up to 50.5% ($685 USD vs $455 USD) compared to South Asian search coordinates. The Gini index of 0.124 and high Coefficient of Variation highlight a highly structured geo-arbitrage pipeline optimized to extract maximum pricing surcharges from higher GDP regions."
  },
  {
    scan_id: "scan_hotel_marriott_nyc",
    gini: 0.178,
    cv: 21.9,
    mwu_u: 2.0,
    mwu_p: 0.0008,
    is_significant: 1,
    temporal: 12.4,
    type: "GDP Purchasing-Power Discrimination",
    severity: "Severe",
    summary: "Clear evidence of systematic purchasing-power dynamic pricing (p = 0.0008). The exact same room type at the Marriott Marquis is priced at $520 USD for visitors scanning via New York residential proxies, while Indian scan profiles receive a price equivalent to $310 USD. This 67% markup matches local purchasing-power capacity, confirming corporate dynamic harvesting of travelers from high-GDP zones."
  },
  {
    scan_id: "scan_shoes_amazon_nike",
    gini: 0.095,
    cv: 11.2,
    mwu_u: 8.0,
    mwu_p: 0.042,
    is_significant: 1,
    temporal: 3.1,
    type: "Localized Device Profile Targeting",
    severity: "Significant",
    summary: "Significant pricing variance detected across device-proxy coordinate layers (p = 0.042). While retail platforms show lower general variance, price margins correlate with device classes, premium MacBook Safari setups paying on average 15-20% higher base rates than Android Chrome profiles in developing geo networks. This signals active device fingerprint profiling."
  },
  {
    scan_id: "scan_booking_paris_apartment",
    gini: 0.165,
    cv: 20.3,
    mwu_u: 3.0,
    mwu_p: 0.0015,
    is_significant: 1,
    temporal: 15.6,
    type: "Geographic Location Gouging",
    severity: "Severe",
    summary: "Severe location-based price gouging identified on luxury vacation rentals (p = 0.0015). Scanning channels located in the EU and North America display a massive tariff increase ($1250 - $1300 USD) compared to developing markets ($750 - $760 USD) for identical booking durations. Gini indices confirm active margin exploitation targeting premium booking vectors."
  },
  {
    scan_id: "scan_uber_lax_dtla",
    gini: 0.221,
    cv: 29.5,
    mwu_u: 1.5,
    mwu_p: 0.0004,
    is_significant: 1,
    temporal: 28.2,
    type: "Behavioral & Coordinated Surge Profiling",
    severity: "Severe",
    summary: "Extreme dynamic discrimination detected (p = 0.0004). The LAX ride segment is highly sensitive to search origin coordinates, showing an extreme Gini index of 0.221. Requests routed from Dubai or London pay premium surge prices of up to $88 USD, representing a 109% surge penalty compared to requests originating from local or developing endpoints. This indicates predictive traveler wealth extraction."
  }
];

console.log("Seeding scans and results...");
db.prepare("DELETE FROM scans").run();
db.prepare("DELETE FROM scan_results").run();
db.prepare("DELETE FROM discrimination_reports").run();
db.prepare("DELETE FROM evidence_packages").run();

const insertScan = db.prepare(`
  INSERT INTO scans (id, target_url, target_description, scan_type, status, total_geos, completed_geos)
  VALUES (@id, @target_url, @target_description, @scan_type, @status, @total_geos, @completed_geos)
`);

const insertResult = db.prepare(`
  INSERT INTO scan_results (id, scan_id, geo_profile_id, price_local, currency, price_usd, device_profile, raw_html_snippet, content_hash, response_status, error_message)
  VALUES (@id, @scan_id, @geo_profile_id, @price_local, @currency, @price_usd, @device_profile, @raw_html_snippet, @content_hash, @response_status, @error_message)
`);

const insertReport = db.prepare(`
  INSERT INTO discrimination_reports (id, scan_id, gini_coefficient, cv_percentage, mann_whitney_u, mann_whitney_p, is_significant, temporal_score, discrimination_type, severity, ai_summary)
  VALUES (@id, @scan_id, @gini_coefficient, @cv_percentage, @mann_whitney_u, @mann_whitney_p, @is_significant, @temporal_score, @discrimination_type, @severity, @ai_summary)
`);

const insertEvidence = db.prepare(`
  INSERT INTO evidence_packages (id, scan_id, package_json, timestamp_chain, content_hashes)
  VALUES (@id, @scan_id, @package_json, @timestamp_chain, @content_hashes)
`);

db.transaction(() => {
  for (const scan of scans) {
    insertScan.run(scan);
    const results = scanResults[scan.id] || [];
    const hashesList = [];
    const timestampsList = [];
    
    for (const r of results) {
      const mockRes = makeMockResult(scan.id, r.geo, r.usd, r.cur, r.rate, r.dev);
      insertResult.run(mockRes);
      hashesList.push({ geo: r.geo, hash: mockRes.content_hash });
      timestampsList.push({ geo: r.geo, timestamp: new Date().toISOString() });
    }
    
    // Seed Report
    const repData = discriminationReports.find(d => d.scan_id === scan.id);
    if (repData) {
      insertReport.run({
        id: `rep_${scan.id}`,
        scan_id: scan.id,
        gini_coefficient: repData.gini,
        cv_percentage: repData.cv,
        mann_whitney_u: repData.mwu_u,
        mann_whitney_p: repData.mwu_p,
        is_significant: repData.is_significant,
        temporal_score: repData.temporal,
        discrimination_type: repData.type,
        severity: repData.severity,
        ai_summary: repData.summary
      });
    }

    // Seed Evidence
    const evidenceJson = JSON.stringify({
      scan_id: scan.id,
      target_url: scan.target_url,
      timestamp: new Date().toISOString(),
      price_matrix: results.map(r => ({ geo: r.geo, usd: r.usd, cur: r.cur, rate: r.rate, dev: r.dev })),
      stats: repData ? { gini: repData.gini, cv: repData.cv, mwu_p: repData.mwu_p, severity: repData.severity } : {}
    });

    insertEvidence.run({
      id: `ev_${scan.id}`,
      scan_id: scan.id,
      package_json: evidenceJson,
      timestamp_chain: JSON.stringify(timestampsList),
      content_hashes: JSON.stringify(hashesList)
    });
  }
})();

console.log("Seeding scans, results, reports, and evidence packages completed successfully.");
console.log("Database initialized and fully populated! 🎯");
db.close();
