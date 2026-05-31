import { 
  calculateGini, 
  calculateCV, 
  calculateMannWhitneyU, 
  runForensics 
} from "../src/lib/engines/statistics";

console.log("=========================================");
console.log("🧪 PRICEGHOST FORENSICS ENGINE UNIT TESTS");
console.log("=========================================\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] - ${message}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] - ${message}`);
  }
}

// -------------------------------------------------------------
// Test Case 1: Uniform Fair Market Pricing
// -------------------------------------------------------------
try {
  const prices = [100, 100, 100, 100, 100];
  const gini = calculateGini(prices);
  const cv = calculateCV(prices);
  const report = runForensics(prices);

  assert(gini === 0, `Uniform pricing must have Gini = 0 (got ${gini})`);
  assert(cv === 0, `Uniform pricing must have CV = 0 (got ${cv})`);
  assert(report.severity === "None", `Uniform pricing must have severity = 'None' (got ${report.severity})`);
  assert(report.discriminationType === "Uniform Fair Market", `Uniform type (got ${report.discriminationType})`);
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 1 crashed: ", e.message);
}

// -------------------------------------------------------------
// Test Case 2: Mild Pricing Volatility
// -------------------------------------------------------------
try {
  const prices = [98, 100, 102, 99, 101]; // very close range
  const gini = calculateGini(prices);
  const cv = calculateCV(prices);
  const report = runForensics(prices);
  
  assert(gini > 0 && gini < 0.03, `Mild Gini must be low (got ${gini})`);
  assert(cv > 0 && cv < 3, `Mild CV must be low (got ${cv})`);
  assert(report.severity === "None" || report.severity === "Mild", `Mild pricing severity (got ${report.severity})`);
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 2 crashed: ", e.message);
}

// -------------------------------------------------------------
// Test Case 3: Significant Pricing Volatility
// -------------------------------------------------------------
try {
  const prices = [100, 115, 130, 95, 105];
  const report = runForensics(prices);
  
  assert(report.severity === "Significant", `Volatility must trigger 'Significant' (got ${report.severity})`);
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 3 crashed: ", e.message);
}

// -------------------------------------------------------------
// Test Case 4: Severe Dynamic Pricing Discrimination
// -------------------------------------------------------------
try {
  // Mumbai to London flight simulation: Low: 455, High: 685
  const prices = [455, 460, 480, 490, 510, 520, 580, 590, 682, 685];
  const gini = calculateGini(prices);
  const report = runForensics(prices);

  assert(gini > 0.08, `Gini index for severe Flight scan must be > 0.08 (got ${gini})`);
  assert(report.severity === "Severe", `Severe flight scan must trigger 'Severe' (got ${report.severity})`);
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 4 crashed: ", e.message);
}

// -------------------------------------------------------------
// Test Case 5: Mann-Whitney U Test Mathematical Audits
// -------------------------------------------------------------
try {
  // Group A (low GDP prices): [10, 12, 11, 13]
  // Group B (high GDP prices): [20, 22, 21, 23]
  const groupA = [10, 11, 12, 13];
  const groupB = [20, 21, 22, 23];
  const mwu = calculateMannWhitneyU(groupA, groupB);
  
  // Since there is no overlap:
  // rankSumA: 1+2+3+4 = 10
  // U1 = 4*4 + 4*5/2 - 10 = 16 + 10 - 10 = 16
  // U2 = 4*4 - 16 = 0
  // U = min(16, 0) = 0
  assert(mwu.uStatistic === 0, `Completely separated groups must have U = 0 (got ${mwu.uStatistic})`);
  assert(mwu.pValue < 0.05, `Completely separated groups must have significant p-value < 0.05 (got ${mwu.pValue})`);
  assert(mwu.isSignificant === true, "MWU isSignificant should be true");
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 5 crashed: ", e.message);
}

// -------------------------------------------------------------
// Test Case 6: Temporal Escalation / Behavioral Checking
// -------------------------------------------------------------
try {
  const prices = [100, 100, 100, 100, 100];
  const temporalPair = { before: 100, after: 125 }; // 25% price hike
  const report = runForensics(prices, undefined, temporalPair);
  
  assert(report.temporalScore === 25, `Temporal score must be exactly 25% (got ${report.temporalScore})`);
  assert(report.discriminationType === "Behavioral & Coordinated Surge Profiling", `Should classify as Behavioral (got ${report.discriminationType})`);
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 6 crashed: ", e.message);
}

// -------------------------------------------------------------
// Test Case 7: Integrated Forensics (GDP Group Splitting)
// -------------------------------------------------------------
try {
  // 6 locations: Low GDP: [100, 110, 105], High GDP: [150, 160, 155]
  const data = [
    { price: 100, gdp: 2000 },
    { price: 110, gdp: 5000 },
    { price: 105, gdp: 3000 },
    { price: 150, gdp: 50000 },
    { price: 160, gdp: 70000 },
    { price: 155, gdp: 60000 }
  ];
  
  const prices = data.map(x => x.price);
  const report = runForensics(prices, data);
  
  assert(report.mannWhitneyU !== undefined, "Mann-Whitney U result should be computed");
  assert(report.mannWhitneyU?.isSignificant === true, "Mann-Whitney U must show statistical significance");
  assert(report.discriminationType === "GDP Purchasing-Power Discrimination", `Should identify as purchasing-power (got ${report.discriminationType})`);
} catch (e: any) {
  failed++;
  console.error("❌ Test Case 7 crashed: ", e.message);
}

console.log("\n=========================================");
console.log(`📊 TESTS AUDIT RESULT: ${passed} PASSED | ${failed} FAILED`);
console.log("=========================================");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL FORENSIC ENGINE MATHEMATICAL CHECKS PASSED!");
  process.exit(0);
}
