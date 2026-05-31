const fs = require("fs");
const path = require("path");

// Load local environment variables manually
const envPath = path.resolve(__dirname, "../.env.local");
console.log(`Loading credentials from: ${envPath}`);
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split(/\r?\n/);
  for (const line of lines) {
    if (line.trim().startsWith("#") || line.trim() === "") continue;
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || "";
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value.trim();
    }
  }
}

// Mock Geo Profiles
const testProfiles = [
  { id: "geo_mumbai", name: "Mumbai, India", country_code: "IN", city: "Mumbai", flag_emoji: "🇮🇳", gdp_per_capita: 2500, timezone: "Asia/Kolkata" },
  { id: "geo_newyork", name: "New York, USA", country_code: "US", city: "New York", flag_emoji: "🇺🇸", gdp_per_capita: 80000, timezone: "America/New_York" }
];

async function run() {
  console.log("Testing scraper.ts scrapeMultiGeo...");
  
  // Dynamically require TS transpiled/built scraper engine
  // Since Next.js uses ESM, we will mock a simple fetch call that mimics our scraper.ts behavior to test Bright Data directly!
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  const zoneName = process.env.BRIGHT_DATA_ZONE || "web_unlocker1";
  
  if (!apiKey) {
    console.log("❌ BRIGHT_DATA_API_KEY missing.");
    return;
  }
  
  console.log(`Using Bright Data key: ...${apiKey.slice(-6)}`);
  console.log(`Using Zone: ${zoneName}`);
  
  try {
    const response = await fetch("https://api.brightdata.com/request", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        zone: zoneName,
        url: "https://example.com",
        country: "us",
        format: "raw",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        }
      })

    });
    
    console.log(`Status: ${response.status} - ${response.statusText}`);
    if (response.ok) {
      const html = await response.text();
      console.log("🟢 SUCCESS! Scraped Example.com successfully!");
      console.log(`HTML Length: ${html.length} bytes`);
      console.log("Snippet:");
      console.log(html.substring(0, 300));
    } else {
      const errText = await response.text();
      console.error(`🔴 Scraper failed: ${errText}`);
    }
  } catch (err) {
    console.error("🔴 Connection exception:", err.message);
  }
}

run();
