const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
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

async function run() {
  const apiKey = process.env.BRIGHT_DATA_API_KEY;
  if (!apiKey) {
    console.error("BRIGHT_DATA_API_KEY missing.");
    return;
  }
  
  try {
    const response = await fetch("https://api.brightdata.com/zone/get_active_zones", {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    const data = await response.json();
    console.log("Bright Data active zones response:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching zones:", err.message);
  }
}

run();
