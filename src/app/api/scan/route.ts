import { NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { runForensics } from "@/lib/engines/statistics";
import { scrapeMultiGeo, GeoProfile } from "@/lib/engines/scraper";
import { generateEvidencePackage } from "@/lib/engines/evidence";
import { classifyPricingPattern } from "@/lib/engines/classifier";
import { indexAnomalyInCognee } from "@/lib/engines/cognee";
import { triggerAlertWorkflow } from "@/lib/engines/triggerware";

export async function POST(request: Request) {
  try {
    const { targetUrl, targetDescription } = await request.json();

    if (!targetUrl || targetUrl.trim() === "") {
      return NextResponse.json({ error: "Target URL is required" }, { status: 400 });
    }

    const scanId = `scan_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const description = targetDescription || `Dynamic check on: ${new URL(targetUrl).hostname}`;

    // 1. Fetch Active Geo Profiles
    const activeProfiles = db.prepare("SELECT * FROM geo_profiles WHERE is_active = 1").all() as GeoProfile[];
    if (activeProfiles.length === 0) {
      return NextResponse.json({ error: "No active geo profiles found in database" }, { status: 500 });
    }

    // 2. Insert Pending Scan Record
    db.prepare(`
      INSERT INTO scans (id, target_url, target_description, scan_type, status, total_geos, completed_geos)
      VALUES (?, ?, ?, 'url', 'pending', ?, 0)
    `).run(scanId, targetUrl, description, activeProfiles.length);

    // 3. Trigger Concurrent Scraper (with rotated profiles & dynamic GDP mock fallback)
    const scrapedResults = await scrapeMultiGeo(targetUrl, activeProfiles);

    // 4. Insert Scraper Results in Database
    const insertResult = db.prepare(`
      INSERT INTO scan_results (id, scan_id, geo_profile_id, price_local, currency, price_usd, device_profile, raw_html_snippet, content_hash, response_status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const res of scrapedResults) {
        insertResult.run(
          `res_${crypto.randomUUID().slice(0, 8)}`,
          scanId,
          res.geo_profile_id,
          res.price_local,
          res.currency,
          res.price_usd,
          res.device_profile,
          res.raw_html_snippet,
          res.content_hash,
          res.response_status,
          res.error_message
        );
      }
    })();

    // Update scan status
    db.prepare("UPDATE scans SET status = 'completed', completed_geos = ? WHERE id = ?").run(
      scrapedResults.length,
      scanId
    );

    // 5. Execute Mathematical Forensics Engine
    const pricesUsd = scrapedResults.map(r => r.price_usd);
    const geoGdpMap = scrapedResults.map(r => {
      const p = activeProfiles.find(ap => ap.id === r.geo_profile_id)!;
      return { price: r.price_usd, gdp: p.gdp_per_capita };
    });

    const stats = runForensics(pricesUsd, geoGdpMap);
    
    // Execute GDP Pearson Correlation Classifier
    const gdps = activeProfiles.map(p => p.gdp_per_capita);
    const classification = classifyPricingPattern(pricesUsd, gdps, stats.temporalScore);

    // 6. Generate AI Narrative Indictment via AI/ML API (Unified completion)
    const aimlKey = process.env.AIML_API_KEY;
    let aiSummary = "";

    if (aimlKey && aimlKey.length > 10 && !aimlKey.startsWith("your_")) {
      try {
        const prompt = `
          You are an elite investigative financial journalist writing a leaked intelligence dossier exposing dynamic pricing gouging.
          Target URL: ${targetUrl}
          Price Matrix Scraped:
          ${scrapedResults.map(r => `- ${r.name} (${r.country_code}): $${r.price_usd} USD via ${r.device_profile}`).join("\n")}
          
          Statistical Forensic Calculations:
          - Gini Coefficient of Inequality: ${stats.gini} (0 = Fair, 1 = Exploited)
          - Pricing Volatility (CV %): ${stats.cv}%
          - Mann-Whitney U Significance Test: p = ${stats.mannWhitneyU?.pValue ?? "N/A"}
          - GDP Pearson Wealth Correlation: r = ${classification.correlationCoefficient}
          - Severity Classification: ${stats.severity} Surcharge Index
          - Dynamic Exploitation Category: ${classification.patternType}
          
          Write a formal, high-impact natural language indictment explaining these findings.
          Format it like a prestige investigative journalism exposé. Focus on the raw dynamic difference, how they charge wealthier countries more (or exploit isolated device fingerprints), and state why this proves dynamic discrimination with absolute statistical evidence. Keep it under 200 words. Bold key figures. Do not use placeholders.
        `;

        const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${aimlKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: "You are a prestigious investigative journalist writing a forensic dynamic pricing indictment." },
              { role: "user", content: prompt }
            ],
            max_tokens: 300,
            temperature: 0.2
          })
        });

        if (response.ok) {
          const completion = await response.json();
          aiSummary = completion.choices?.[0]?.message?.content || "";
        } else {
          console.error("AI/ML API completed with error:", response.statusText);
        }
      } catch (err) {
        console.error("AI/ML API request failed:", err);
      }
    }

    // Dynamic fallback narrative if API fails or key is missing
    if (!aiSummary || aiSummary.trim() === "") {
      aiSummary = `Forensic analysis confirms ${stats.severity.toLowerCase()} geographic pricing discrimination (${classification.patternType}). Scraped prices reveal a Gini coefficient of ${stats.gini} and standard deviation volatility of ${stats.cv}%. The Pearson GDP Correlation coefficient of r = ${classification.correlationCoefficient} confirms a ${Math.abs(classification.correlationCoefficient) > 0.5 ? "strong correlation" : "moderate relationship"} between search location wealth and dynamic price gouging. ${classification.verdict}`;
    }

    // 7. Insert Forensics Report into SQLite
    db.prepare(`
      INSERT INTO discrimination_reports (id, scan_id, gini_coefficient, cv_percentage, mann_whitney_u, mann_whitney_p, is_significant, temporal_score, discrimination_type, severity, ai_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `rep_${crypto.randomUUID().slice(0, 8)}`,
      scanId,
      stats.gini,
      stats.cv,
      stats.mannWhitneyU?.uStatistic || 0,
      stats.mannWhitneyU?.pValue || 1.0,
      stats.mannWhitneyU?.isSignificant ? 1 : 0,
      stats.temporalScore || 0.0,
      classification.patternType,
      stats.severity,
      aiSummary
    );

    // 8. Generate and Seal Cryptographic Evidence Dossier
    const evidencePkg = generateEvidencePackage(
      { id: scanId, target_url: targetUrl, created_at: new Date().toISOString() },
      scrapedResults.map(r => ({
        geo_profile_id: r.geo_profile_id,
        name: r.name,
        flag_emoji: r.flag_emoji,
        price_local: r.price_local,
        currency: r.currency,
        price_usd: r.price_usd,
        device_profile: r.device_profile,
        scraped_at: r.scraped_at,
        content_hash: r.content_hash
      })),
      {
        gini_coefficient: stats.gini,
        cv_percentage: stats.cv,
        discrimination_type: classification.patternType,
        severity: stats.severity,
        mann_whitney_p: stats.mannWhitneyU?.pValue,
        temporal_score: stats.temporalScore
      }
    );

    const hashesList = scrapedResults.map(r => ({ geo: r.name, hash: r.content_hash }));
    const timestampsList = scrapedResults.map(r => ({ geo: r.name, timestamp: r.scraped_at }));

    db.prepare(`
      INSERT INTO evidence_packages (id, scan_id, package_json, timestamp_chain, content_hashes)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `ev_${crypto.randomUUID().slice(0, 8)}`,
      scanId,
      JSON.stringify(evidencePkg),
      JSON.stringify(timestampsList),
      JSON.stringify(hashesList)
    );

    // 9. Ingest anomaly into Cognee cognitive memory & trigger TriggerWare workflows concurrently
    // Fired in background so scan response remains high-velocity
    indexAnomalyInCognee(scanId, targetUrl, stats.gini, stats.cv, stats.severity, aiSummary).catch(err => {
      console.error("Async Cognee index error:", err);
    });

    if (stats.severity === "Severe") {
      triggerAlertWorkflow(scanId, targetUrl, stats.gini, stats.cv, stats.severity, classification.patternType, aiSummary).catch(err => {
        console.error("Async TriggerWare alert error:", err);
      });
    }

    return NextResponse.json({
      success: true,
      scanId,
      gini: stats.gini,
      cv: stats.cv,
      severity: stats.severity,
      patternType: classification.patternType,
      aiSummary
    });

  } catch (err: any) {
    console.error("Critical error in POST /api/scan:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
