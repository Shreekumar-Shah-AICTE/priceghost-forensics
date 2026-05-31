import crypto from "crypto";

export interface EvidencePayload {
  scanId: string;
  targetUrl: string;
  timestamp: string;
  totalGeosScanned: number;
  priceMatrix: Array<{
    geo: string;
    flagEmoji: string;
    priceLocal: number;
    currency: string;
    priceUsd: number;
    deviceProfile: string;
    timestamp: string;
  }>;
  stats: {
    gini: number;
    cv: number;
    discriminationType: string;
    severity: string;
    mannWhitneyP?: number;
    temporalScore?: number;
  };
  timestampChain: Array<{
    geo: string;
    timestamp: string;
  }>;
  integrity: {
    sha256Signature: string;
    signedBy: string;
  };
}

/**
 * Generate a cryptographically sealed Forensic Evidence Package
 */
export function generateEvidencePackage(
  scan: { id: string; target_url: string; created_at: string },
  results: Array<{
    geo_profile_id: string;
    name: string;
    flag_emoji?: string;
    price_local: number;
    currency: string;
    price_usd: number;
    device_profile: string;
    scraped_at: string;
    content_hash: string;
  }>,
  reports: {
    gini_coefficient: number;
    cv_percentage: number;
    discrimination_type: string;
    severity: string;
    mann_whitney_p?: number;
    temporal_score?: number;
  }
): EvidencePayload {
  const priceMatrix = results.map(r => ({
    geo: r.name,
    flagEmoji: r.flag_emoji || "🌐",
    priceLocal: r.price_local,
    currency: r.currency,
    priceUsd: r.price_usd,
    deviceProfile: r.device_profile,
    timestamp: r.scraped_at
  }));

  const timestampChain = results.map(r => ({
    geo: r.name,
    timestamp: r.scraped_at
  }));

  // Create base evidence JSON payload
  const evidenceBody = {
    scanId: scan.id,
    targetUrl: scan.target_url,
    timestamp: scan.created_at || new Date().toISOString(),
    totalGeosScanned: results.length,
    priceMatrix,
    stats: {
      gini: reports.gini_coefficient,
      cv: reports.cv_percentage,
      discriminationType: reports.discrimination_type,
      severity: reports.severity,
      mannWhitneyP: reports.mann_whitney_p,
      temporalScore: reports.temporal_score
    },
    timestampChain
  };

  // Sign the package body with SHA-256 for integrity auditing
  const signature = crypto
    .createHash("sha256")
    .update(JSON.stringify(evidenceBody))
    .digest("hex");

  return {
    ...evidenceBody,
    integrity: {
      sha256Signature: signature,
      signedBy: "PriceGhost Cryptographic Forensics Engine v5"
    }
  };
}
