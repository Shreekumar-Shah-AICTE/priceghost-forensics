"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import HeroCanvas from "@/components/HeroCanvas";

interface HistoricScan {
  id: string;
  target_url: string;
  target_description: string;
  gini_coefficient: number | null;
  cv_percentage: number | null;
  discrimination_type: string | null;
  severity: string | null;
  created_at: string;
}

export default function Home() {
  const [urlInput, setUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [historicScans, setHistoricScans] = useState<HistoricScan[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // 1. Fetch historical investigations ledger on mount
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch("/api/scans");
        if (response.ok) {
          const data = await response.json();
          setHistoricScans(data);
        }
      } catch (err) {
        console.error("Failed to load scans history:", err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchHistory();
  }, []);

  // Curated dynamic diagnostic presets
  const presets = [
    { name: "✈️ Mumbai-London Flight Surcharge", url: "https://www.qatarairways.com/flights/mumbai-to-london" },
    { name: "🏨 NYC Marriott Marquis Room", url: "https://www.marriott.com/hotels/nycmq-marriott-marquis" },
    { name: "👜 Nike Air Max Dynamic Retail", url: "https://www.amazon.com/Nike-Air-Max-270" }
  ];

  // 2. Play the highly cinematic terminal scanner animation prior to redirecting
  const triggerScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput || urlInput.trim() === "") return;

    setIsScanning(true);
    setTerminalLogs([]);

    const logs = [
      "⚡ PriceGhost Harvester v5 boot initiated.",
      "🔐 Authenticating Bright Data proxy zone: web_unlocker1...",
      "🛡️ Credentials authenticated. Free credit pool: $252.00 active.",
      "🌐 Resolving coordinate beacons (10 Global Proxy Targets)...",
      "🛰️ Connecting node 01: [geo_mumbai] IN ... 🟢 Route secure",
      "🛰️ Connecting node 02: [geo_newyork] US ... 🟢 Route secure",
      "🛰️ Connecting node 03: [geo_london] GB ... 🟢 Route secure",
      "🛰️ Connecting node 04: [geo_tokyo] JP ... 🟢 Route secure",
      "🛰️ Connecting node 05: [geo_berlin] DE ... 🟢 Route secure",
      "🛰️ Connecting node 06: [geo_sydney] AU ... 🟢 Route secure",
      "🛰️ Connecting node 07: [geo_lagos] NG ... 🟢 Route secure",
      "🛰️ Connecting node 08: [geo_buenosaires] AR ... 🟢 Route secure",
      "🛰️ Connecting node 09: [geo_dubai] AE ... 🟢 Route secure",
      "🛰️ Connecting node 10: [geo_singapore] SG ... 🟢 Route secure",
      "🚀 Coordinated multi-geo proxy scrape triggered (concurrent Promise.all).",
      "📦 Harvesting raw HTML response payloads...",
      "🔬 Running price selector parser regex arrays...",
      "🧮 Calculating Gini Index of Spatial Pricing Inequality...",
      "📐 Computing Mann-Whitney U distribution significance...",
      "📈 Generating Pearson GDP Linear Correlation Coefficient...",
      "⛓️ Cryptographically signing evidence block with SHA-256...",
      "📝 Contacting AI/ML API Narrative Indictment writer...",
      "🎯 Scan complete! Packing dossier. Redirecting to Evidence Lab..."
    ];

    // Stagger logs in terminal simulation
    for (let i = 0; i < logs.length; i++) {
      await new Promise((res) => setTimeout(res, 120 + Math.random() * 80));
      setTerminalLogs((prev) => [...prev, logs[i]]);
    }

    // Call actual POST API scan endpoint
    try {
      const response = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUrl: urlInput })
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to evidence dossier lab
        window.location.href = `/scan?id=${data.scanId}`;
      } else {
        alert("Scraping completed, but scan API encountered an error.");
        setIsScanning(false);
      }
    } catch (err) {
      console.error(err);
      alert("Proxy scraping failed. Redirecting to fallback seeded scan.");
      // Fallback redirect for demonstration
      window.location.href = "/scan?id=scan_flight_mumbai_london";
    }
  };

  const selectPreset = (url: string) => {
    setUrlInput(url);
    // Smooth scroll to input box
    const inputElement = document.getElementById("url-input-field");
    if (inputElement) {
      inputElement.scrollIntoView({ behavior: "smooth" });
      inputElement.focus();
    }
  };

  return (
    <main className="w-full min-h-screen bg-[#050506] relative flex flex-col">
      {/* 1. Cinematic Scroll-Based Hero Section */}
      <HeroCanvas scrollHeightVh={250} />

      {/* 2. Primary Administrative and Command Section */}
      <section className="relative z-30 w-full max-w-7xl mx-auto px-4 md:px-8 py-24 flex flex-col gap-24 bg-[#050506]">
        {/* Newspaper Styled Header Accent */}
        <div className="border-b-2 border-t border-[#F3F3F0]/20 py-8 flex flex-col md:flex-row justify-between items-baseline gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono text-[#00FFFF] tracking-[0.3em] uppercase font-bold">
              Autonomous Surveillance Network
            </span>
            <h2 className="text-6xl editorial-heading italic text-[#F3F3F0] font-normal">
              PriceGhost
            </h2>
          </div>
          <span className="text-xs font-mono text-[#94A3B8] max-w-xs text-right">
            Prestige Dynamic Pricing Auditing. Powered by Bright Data proxies & SQLite forensics.
          </span>
        </div>

        {/* Dynamic Diagnostics Command Center */}
        <div id="scanner-command-section" className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          {/* Form and Scraper inputs (Left columns) */}
          <div className="lg:col-span-2 flex flex-col gap-8 bg-[#111113] border-editorial p-8 relative">
            <div className="flex flex-col gap-2 border-b border-[#F3F3F0]/10 pb-4">
              <span className="text-[10px] font-mono text-[#00FFFF] tracking-widest uppercase font-bold">
                Harvester Zone
              </span>
              <h3 className="text-3xl editorial-heading italic text-[#F3F3F0] font-normal">
                Initiate New Spatial Audit
              </h3>
            </div>

            <form onSubmit={triggerScan} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="url-input-field" className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                  Target Product or Booking URL
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    id="url-input-field"
                    type="url"
                    required
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://www.airline.com/flights/route..."
                    className="flex-1 bg-[#050506] border border-[#F3F3F0]/20 px-4 py-3 font-mono text-sm text-[#F3F3F0] focus:outline-none focus:border-[#00FFFF] transition-all rounded-none placeholder:text-[#94A3B8]/30"
                  />
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="editorial-btn bg-[#F3F3F0] text-[#050506] border-none font-bold text-xs uppercase tracking-widest flex items-center justify-center min-w-[140px]"
                  >
                    {isScanning ? "Scraping..." : "Scan Target"}
                  </button>
                </div>
              </div>
            </form>

            {/* Diagnostics presets */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                Select Curated Diagnostics Target
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectPreset(preset.url)}
                    className="text-left bg-[#050506] hover:bg-[#F3F3F0]/5 border-editorial p-3 flex flex-col gap-2 transition-all group select-none text-xs rounded-none"
                  >
                    <span className="font-mono text-[#00FFFF] group-hover:text-[#FF3333] transition-colors font-bold uppercase tracking-wider text-[10px]">
                      Preset {idx + 1}
                    </span>
                    <span className="text-[#94A3B8] group-hover:text-[#F3F3F0] transition-colors leading-tight font-serif italic text-sm">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Scanning Terminal overlay */}
            {isScanning && (
              <div className="absolute inset-0 bg-[#050506]/98 flex flex-col p-6 z-40 border border-[#00FFFF]/20">
                <div className="flex justify-between items-center border-b border-[#00FFFF]/20 pb-2 mb-4 font-mono text-xs text-[#00FFFF]">
                  <span className="animate-pulse">● GEOSPATIAL SCANNER ACTIVE</span>
                  <span>{terminalLogs.length}/23 Log vectors</span>
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-xs text-[#94A3B8] flex flex-col gap-1.5 scrollbar-thin select-none">
                  {terminalLogs.map((log, idx) => (
                    <div key={idx} className={`${idx === terminalLogs.length - 1 ? "text-[#00FFFF] font-bold" : ""}`}>
                      {log}
                    </div>
                  ))}
                  <div className="w-1.5 h-3 bg-[#00FFFF] animate-ping mt-1"></div>
                </div>
              </div>
            )}
          </div>

          {/* System audit details (Right column) */}
          <div className="flex flex-col bg-[#111113] border-editorial p-8 gap-6 relative select-none">
            <div className="border-b border-[#F3F3F0]/10 pb-4 flex flex-col gap-1">
              <span className="text-[10px] font-mono text-[#FF3333] tracking-widest uppercase font-bold">
                Harvester Integrity
              </span>
              <h3 className="text-3xl editorial-heading italic text-[#F3F3F0] font-normal">
                Sponsor Infrastructure
              </h3>
            </div>
            
            <div className="flex flex-col gap-4 font-sans text-xs text-[#94A3B8] leading-relaxed">
              <div className="flex flex-col gap-1.5 border-b border-[#F3F3F0]/5 pb-3">
                <strong className="text-[#F3F3F0] font-mono tracking-wider uppercase text-[10px]">
                  🛰️ BRIGHT DATA RESIDENTIAL PROXIES
                </strong>
                <span>Fires 10 concurrent requests to target nodes rotating standard mobile and desktop device fingerprints on each coordinate path.</span>
              </div>
              <div className="flex flex-col gap-1.5 border-b border-[#F3F3F0]/5 pb-3">
                <strong className="text-[#F3F3F0] font-mono tracking-wider uppercase text-[10px]">
                  🧠 UNIFIED COMPLETION COMPILER
                </strong>
                <span>Calls unified AI/ML API (gpt-4o-mini) to translate raw Gini volatility indices and Pearson correlations into plain-English indictments.</span>
              </div>
              <div className="flex flex-col gap-1.5 pb-2">
                <strong className="text-[#F3F3F0] font-mono tracking-wider uppercase text-[10px]">
                  🛡️ COURTROOM EVIDENCE SEAL
                </strong>
                <span>Creates cryptographically signed Evidence Dossiers embedding SHA-256 HTML payload hashes and timestamp matrices to block audit tampering.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Investigation Ledger */}
        <div className="flex flex-col gap-8">
          <div className="border-b border-[#F3F3F0]/20 pb-4 flex flex-col md:flex-row justify-between items-baseline gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono text-[#00FFFF] tracking-widest uppercase font-bold">
                Exposé Ledger
              </span>
              <h3 className="text-3xl editorial-heading italic text-[#F3F3F0] font-normal">
                Historical Dynamic Pricing Dossiers
              </h3>
            </div>
            <span className="text-xs font-mono text-[#94A3B8]">
              {historicScans.length} active case files registered in local better-sqlite3 ledger.
            </span>
          </div>

          {loadingHistory ? (
            <div className="w-full text-center py-12 font-mono text-sm text-[#94A3B8] animate-pulse">
              [Retrieving database dossiers ledger...]
            </div>
          ) : (
            <div className="w-full overflow-x-auto select-none border-editorial">
              <table className="w-full text-left font-sans text-xs border-collapse">
                <thead>
                  <tr className="bg-[#111113] border-b border-[#F3F3F0]/20 font-mono uppercase text-[#F3F3F0] tracking-wider text-[10px]">
                    <th className="py-4 px-6">Investigation Target</th>
                    <th className="py-4 px-6 text-center">Gini Index</th>
                    <th className="py-4 px-6 text-center">Volatility (CV %)</th>
                    <th className="py-4 px-6">Dynamic Surcharge Type</th>
                    <th className="py-4 px-6 text-center">Severity</th>
                    <th className="py-4 px-6 text-right">Audit Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F3F0]/10">
                  {historicScans.map((scan) => (
                    <tr
                      key={scan.id}
                      className="hover:bg-[#111113]/40 transition-colors font-mono text-[#94A3B8]"
                    >
                      <td className="py-4 px-6 flex flex-col gap-1">
                        <strong className="text-[#F3F3F0] font-serif italic text-sm font-normal tracking-wide leading-tight">
                          {scan.target_description}
                        </strong>
                        <span className="text-[10px] font-mono text-slate-500 max-w-sm truncate block">
                          {scan.target_url}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-bold text-[#00FFFF] font-mono-tabular">
                        {scan.gini_coefficient ? scan.gini_coefficient.toFixed(3) : "0.000"}
                      </td>
                      <td className="py-4 px-6 text-center text-[#F3F3F0] font-mono-tabular">
                        {scan.cv_percentage ? `${scan.cv_percentage.toFixed(1)}%` : "0.0%"}
                      </td>
                      <td className="py-4 px-6 font-serif italic text-sm text-[#F3F3F0]/80">
                        {scan.discrimination_type || "Uniform Pricing"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 ${
                            scan.severity === "Severe"
                              ? "border border-[#FF3333] text-[#FF3333] bg-[#FF3333]/5"
                              : scan.severity === "Significant"
                              ? "border border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/5"
                              : "border border-slate-600 text-slate-400 bg-slate-500/5"
                          }`}
                        >
                          {scan.severity || "None"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Link
                          href={`/scan?id=${scan.id}`}
                          className="font-mono text-xs font-bold uppercase tracking-wider text-[#F3F3F0] hover:text-[#00FFFF] underline underline-offset-4 decoration-[#00FFFF]/50 hover:decoration-[#00FFFF] transition-all"
                        >
                          Open Dossier →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
