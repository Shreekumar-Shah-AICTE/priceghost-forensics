import { ForensicsResult } from "@/lib/engines/statistics";
import { ClassificationResult } from "@/lib/engines/classifier";

interface StatsCardProps {
  stats: {
    gini: number;
    cv: number;
    mannWhitneyU?: {
      uStatistic: number;
      zScore: number;
      pValue: number;
      isSignificant: boolean;
    };
    temporalScore?: number;
    discriminationType: string;
    severity: string;
  };
  classification: {
    correlationCoefficient: number;
    patternType: string;
    verdict: string;
    confidenceScore: number;
  };
  geosCount: number;
}

export default function StatsCard({ stats, classification, geosCount }: StatsCardProps) {
  // Format decimals safely
  const giniVal = stats.gini.toFixed(3);
  const cvVal = stats.cv.toFixed(1);
  const pearsonVal = classification.correlationCoefficient.toFixed(3);
  const pVal = stats.mannWhitneyU?.pValue !== undefined ? stats.mannWhitneyU.pValue.toFixed(4) : "1.0000";

  // Map severity styles
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case "Severe":
        return "border border-[#FF3333] text-[#FF3333] bg-[#FF3333]/10";
      case "Significant":
        return "border border-[#00FFFF] text-[#00FFFF] bg-[#00FFFF]/10";
      case "Mild":
        return "border border-[#F3F3F0]/40 text-[#F3F3F0]/80 bg-[#F3F3F0]/5";
      default:
        return "border border-emerald-500/50 text-emerald-400 bg-emerald-500/10";
    }
  };

  return (
    <div className="w-full flex flex-col bg-[#111113] border-editorial p-6 gap-6 relative select-none">
      {/* Newspaper Column Double Header Border */}
      <div className="border-t-2 border-b border-[#F3F3F0]/20 py-2 flex flex-col gap-1">
        <span className="text-[10px] font-mono tracking-[0.2em] text-[#00FFFF] uppercase font-bold">
          Forensic Diagnostics Block
        </span>
        <h3 className="text-3xl editorial-heading italic leading-tight text-[#F3F3F0] font-normal">
          Pricing inequality index
        </h3>
      </div>

      {/* Massive Typographic Gini Index */}
      <div className="flex flex-col gap-2 py-4 border-b border-[#F3F3F0]/10 relative">
        <div className="flex items-baseline justify-between">
          <span className="text-8xl font-bold font-mono-tabular tracking-tighter text-[#00FFFF]">
            {giniVal}
          </span>
          <span className={`text-xs px-2.5 py-1 font-mono uppercase font-bold tracking-wider ${getSeverityBadgeClass(stats.severity)}`}>
            {stats.severity} Index
          </span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono text-[#94A3B8] mt-2">
          <span>0.0 = Uniform Fair</span>
          <span>1.0 = Max Exploitation</span>
        </div>
      </div>

      {/* Volatility & Correlation Data Column */}
      <div className="grid grid-cols-2 gap-4 border-b border-[#F3F3F0]/10 pb-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
            Volatility (CV %)
          </span>
          <span className="text-3xl font-bold font-mono-tabular text-[#F3F3F0]">
            {cvVal}%
          </span>
          <span className="text-[9px] text-[#94A3B8] leading-normal font-sans">
            Coefficient of variation across search vectors.
          </span>
        </div>

        <div className="flex flex-col gap-1 border-l border-[#F3F3F0]/10 pl-4">
          <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
            Wealth Correlation (r)
          </span>
          <span className={`text-3xl font-bold font-mono-tabular ${Math.abs(classification.correlationCoefficient) > 0.5 ? "text-[#FF3333]" : "text-[#F3F3F0]"}`}>
            {pearsonVal}
          </span>
          <span className="text-[9px] text-[#94A3B8] leading-normal font-sans">
            Pearson GDP/Price linear correlation.
          </span>
        </div>
      </div>

      {/* Hypothesis Statement Box */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
          <span>Mann-Whitney Hypothesis</span>
          <span className="text-[#00FFFF]">p = {pVal}</span>
        </div>

        <p className="text-sm italic leading-relaxed text-[#94A3B8] font-serif font-light">
          "Assuming a uniform market, the probability of obtaining identical products with these price discrepancies across {geosCount} coordinates due to random noise is <span className="font-bold font-mono text-[#F3F3F0] not-italic">${(parseFloat(pVal) * 100).toFixed(3)}%</span>. We reject the null hypothesis of uniform pricing with <span className="font-bold text-[#F3F3F0] not-italic">${Math.max(0, 100 - parseFloat(pVal) * 100).toFixed(2)}%</span> mathematical confidence."
        </p>

        {stats.temporalScore !== undefined && stats.temporalScore > 0 && (
          <div className="mt-2 border border-[#FF3333]/20 bg-[#FF3333]/5 p-3 flex flex-col gap-1">
            <span className="text-[9px] font-mono text-[#FF3333] uppercase tracking-widest font-bold">
              Temporal Markup Warning
            </span>
            <span className="text-xs text-[#94A3B8] font-sans">
              Subsequent search triggered a <strong className="text-[#FF3333] font-mono font-bold">+{stats.temporalScore}%</strong> surcharge on identical nodes.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
