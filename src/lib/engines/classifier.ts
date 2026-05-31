export interface ClassificationResult {
  correlationCoefficient: number;
  patternType: string;
  verdict: string;
  confidenceScore: number; // 0-100%
}

/**
 * Calculates the Pearson Correlation Coefficient between two arrays.
 * Formula: r = Sum((x - mean_x) * (y - mean_y)) / Math.sqrt(Sum((x - mean_x)^2) * Sum((y - mean_y)^2))
 */
export function calculatePearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 3 || n !== y.length) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 0;

  return num / Math.sqrt(denX * denY);
}

/**
 * Classifies dynamic pricing patterns using deterministic Pearson correlation and temporal variables
 */
export function classifyPricingPattern(
  pricesUsd: number[],
  countryGdps: number[],
  temporalScore: number = 0
): ClassificationResult {
  const r = calculatePearsonCorrelation(countryGdps, pricesUsd);
  const roundedR = Math.round(r * 1000) / 1000;

  let patternType = "Uniform Pricing Model";
  let verdict = "Prices are uniform across all geographic nodes and device fingerprints.";
  let confidenceScore = 95; // Highly confident in fair pricing

  const priceVariance = calculateVariance(pricesUsd);

  if (priceVariance > 0.01) {
    if (temporalScore >= 15) {
      patternType = "Behavioral & Coordinated Surge Profiling";
      verdict = "Platform escalated prices heavily upon repeated coordinates scanning, proving active consumer search tracker exploitation.";
      confidenceScore = 90;
    } else if (roundedR >= 0.55) {
      patternType = "GDP Purchasing-Power Discrimination";
      verdict = "Prices show a strong positive correlation with regional purchasing power (GDP per capita), charging users in wealthier countries systematically higher rates.";
      confidenceScore = Math.round(Math.abs(roundedR) * 100);
    } else if (roundedR <= -0.55) {
      patternType = "Inverse Geographic Exploitation";
      verdict = "Prices show an inverse GDP correlation, indicating strategic targeted subsidies or isolated regional demand curves.";
      confidenceScore = Math.round(Math.abs(roundedR) * 100);
    } else {
      patternType = "Geographic Location Gouging";
      verdict = "Significant localized price variance detected without strong wealth correlation, highlighting isolated geographic arbitrage opportunities.";
      confidenceScore = 80;
    }
  }

  return {
    correlationCoefficient: roundedR,
    patternType,
    verdict,
    confidenceScore
  };
}

function calculateVariance(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sqDiffs = values.map(v => Math.pow(v - mean, 2));
  return sqDiffs.reduce((a, b) => a + b, 0) / n;
}
