export interface MWUResult {
  uStatistic: number;
  zScore: number;
  pValue: number;
  isSignificant: boolean;
}

export interface ForensicsResult {
  gini: number;
  cv: number;
  mannWhitneyU?: MWUResult;
  temporalScore?: number;
  discriminationType: string;
  severity: "None" | "Mild" | "Significant" | "Severe";
}

/**
 * Standard Normal Cumulative Distribution Function (Polynomial Approximation)
 * Highly accurate approximation for p-value calculation.
 */
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.39894228;
  const p = d * Math.exp(-0.5 * x * x) * t * (
    0.31938153 + t * (
      -0.356563782 + t * (
        1.781477937 + t * (
          -1.821255978 + t * 1.330274429
        )
      )
    )
  );
  return x >= 0 ? 1 - p : p;
}

/**
 * Calculate Gini Coefficient for an array of numbers.
 * Formula: G = (Sum_i Sum_j |p_i - p_j|) / (2 * n^2 * mean)
 */
export function calculateGini(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;

  let absoluteDiffSum = 0;
  let sum = 0;

  for (let i = 0; i < n; i++) {
    sum += prices[i];
    for (let j = 0; j < n; j++) {
      absoluteDiffSum += Math.abs(prices[i] - prices[j]);
    }
  }

  const mean = sum / n;
  if (mean === 0) return 0;

  return absoluteDiffSum / (2 * n * n * mean);
}

/**
 * Calculate Coefficient of Variation (CV) percentage.
 * Formula: CV = (stdDev / mean) * 100
 */
export function calculateCV(prices: number[]): number {
  const n = prices.length;
  if (n < 2) return 0;

  const mean = prices.reduce((a, b) => a + b, 0) / n;
  if (mean === 0) return 0;

  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100;
}

/**
 * Execute Mann-Whitney U Test between low GDP group and high GDP group.
 * Group A: Low GDP countries, Group B: High GDP countries.
 */
export function calculateMannWhitneyU(groupA: number[], groupB: number[]): MWUResult {
  const n1 = groupA.length;
  const n2 = groupB.length;

  if (n1 === 0 || n2 === 0) {
    return { uStatistic: 0, zScore: 0, pValue: 1, isSignificant: false };
  }

  // Combine and assign group labels
  const combined = [
    ...groupA.map(val => ({ val, group: "A" })),
    ...groupB.map(val => ({ val, group: "B" }))
  ];

  // Sort by price ascending
  combined.sort((x, y) => x.val - y.val);

  // Assign ranks with fractional ranks for ties
  const ranks = new Array(combined.length);
  let i = 0;
  while (i < combined.length) {
    let j = i;
    while (j < combined.length - 1 && combined[j + 1].val === combined[i].val) {
      j++;
    }
    // Calculate average rank for tie
    const averageRank = ((i + 1) + (j + 1)) / 2;
    for (let k = i; k <= j; k++) {
      ranks[k] = averageRank;
    }
    i = j + 1;
  }

  // Sum ranks for Group A
  let rankSumA = 0;
  for (let k = 0; k < combined.length; k++) {
    if (combined[k].group === "A") {
      rankSumA += ranks[k];
    }
  }

  // Calculate U Statistics
  const u1 = n1 * n2 + (n1 * (n1 + 1)) / 2 - rankSumA;
  const u2 = n1 * n2 - u1;
  const u = Math.min(u1, u2);

  // Calculate standard normal approximation parameters
  const meanU = (n1 * n2) / 2;
  const varianceU = (n1 * n2 * (n1 + n2 + 1)) / 12;
  const stdDevU = Math.sqrt(varianceU);

  // Z-score (with continuity correction)
  const zScore = stdDevU === 0 ? 0 : (u - meanU) / stdDevU;
  
  // Two-tailed p-value
  const pValue = 2 * normCDF(zScore);

  return {
    uStatistic: u,
    zScore,
    pValue,
    isSignificant: pValue < 0.05
  };
}

/**
 * Run comprehensive statistical forensics on price matrix
 */
export function runForensics(
  prices: number[], 
  geoGdpMap?: { price: number; gdp: number }[],
  temporalPair?: { before: number; after: number }
): ForensicsResult {
  const gini = Math.round(calculateGini(prices) * 1000) / 1000;
  const cv = Math.round(calculateCV(prices) * 10) / 10;
  
  let mannWhitneyU: MWUResult | undefined;
  
  if (geoGdpMap && geoGdpMap.length >= 4) {
    // Dynamically split by median GDP
    const sortedByGdp = [...geoGdpMap].sort((a, b) => a.gdp - b.gdp);
    const medianIndex = Math.floor(sortedByGdp.length / 2);
    const lowGdpGroup = sortedByGdp.slice(0, medianIndex).map(x => x.price);
    const highGdpGroup = sortedByGdp.slice(medianIndex).map(x => x.price);
    
    mannWhitneyU = calculateMannWhitneyU(lowGdpGroup, highGdpGroup);
  }

  let temporalScore: number | undefined;
  if (temporalPair && temporalPair.before > 0) {
    temporalScore = Math.round(((temporalPair.after - temporalPair.before) / temporalPair.before) * 1000) / 10;
  }

  // Determine Severity and Type
  let severity: "None" | "Mild" | "Significant" | "Severe" = "None";
  let discriminationType = "Uniform Fair Market";

  const maxTemporal = temporalScore || 0;

  if (gini >= 0.08 || cv >= 15 || maxTemporal >= 15) {
    severity = "Severe";
  } else if (gini >= 0.04 || cv >= 8 || maxTemporal >= 5) {
    severity = "Significant";
  } else if (gini >= 0.005 || cv >= 1 || maxTemporal > 0) {
    severity = "Mild";
  }

  if (severity !== "None") {
    if (temporalScore && temporalScore > 5) {
      discriminationType = "Behavioral & Coordinated Surge Profiling";
    } else if (mannWhitneyU && mannWhitneyU.isSignificant) {
      discriminationType = "GDP Purchasing-Power Discrimination";
    } else {
      discriminationType = "Geographic Location Gouging";
    }
  }

  return {
    gini,
    cv,
    mannWhitneyU,
    temporalScore,
    discriminationType,
    severity
  };
}
