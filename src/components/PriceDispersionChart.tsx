"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ReferenceLine
} from "recharts";

interface ChartDataPoint {
  city: string;
  priceUsd: number;
  gdpPerCapita: number;
  isInflated: boolean;
}

interface PriceDispersionChartProps {
  data: ChartDataPoint[];
}

export default function PriceDispersionChart({ data }: PriceDispersionChartProps) {
  // Sort data by Price USD ascending to show clear scaling
  const sortedData = [...data].sort((a, b) => a.priceUsd - b.priceUsd);

  // Find min price to draw a baseline representing "Fair Standard Rate"
  const prices = data.map(d => d.priceUsd).filter(p => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Custom tooltips adhering to the Forensic Editorial design system
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-[#111113] border border-[#F3F3F0]/20 p-4 font-mono text-xs flex flex-col gap-2 shadow-2xl">
          <strong className="text-[#F3F3F0] font-sans text-sm">{dataPoint.city}</strong>
          <div className="flex justify-between gap-6 border-b border-[#F3F3F0]/10 pb-1">
            <span className="text-[#94A3B8]">Scraped Price:</span>
            <span className={dataPoint.isInflated ? "text-[#FF3333] font-bold" : "text-[#00FFFF] font-bold"}>
              ${dataPoint.priceUsd} USD
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-[#94A3B8]">GDP Per Capita:</span>
            <span className="text-[#F3F3F0]">${dataPoint.gdpPerCapita.toLocaleString()}</span>
          </div>
          {dataPoint.isInflated && (
            <div className="text-[9px] text-[#FF3333] font-bold uppercase tracking-widest mt-1 border border-[#FF3333]/30 bg-[#FF3333]/5 px-2 py-0.5 text-center">
              Dynamic Surcharge Detected
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#111113] border border-[#F3F3F0]/10 p-6 flex flex-col gap-4">
      {/* Editorial Header */}
      <div className="border-b border-[#F3F3F0]/10 pb-2 flex justify-between items-baseline select-none">
        <span className="text-[9px] font-mono text-[#00FFFF] uppercase tracking-wider font-bold">
          Visual Evidence Model
        </span>
        <span className="text-[9px] font-mono text-slate-500">
          Price vs GDP purchasing correlation map.
        </span>
      </div>

      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={sortedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="city"
              stroke="#94A3B8"
              fontSize={8}
              tickLine={false}
              axisLine={{ stroke: '#F3F3F0', strokeOpacity: 0.1 }}
              fontFamily="monospace"
            />
            <YAxis
              yAxisId="price"
              stroke="#00FFFF"
              fontSize={9}
              tickLine={false}
              axisLine={{ stroke: '#F3F3F0', strokeOpacity: 0.1 }}
              tickFormatter={(v) => `$${v}`}
              fontFamily="monospace"
            />
            <YAxis
              yAxisId="gdp"
              orientation="right"
              stroke="#94A3B8"
              fontSize={8}
              tickLine={false}
              axisLine={{ stroke: '#F3F3F0', strokeOpacity: 0.1 }}
              tickFormatter={(v) => `$${Math.round(v/1000)}k`}
              fontFamily="monospace"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(243,243,240,0.02)' }} />

            {/* Baseline showing fair standard price */}
            {minPrice > 0 && (
              <ReferenceLine
                yAxisId="price"
                y={minPrice}
                stroke="#00FFFF"
                strokeDasharray="3 3"
                strokeOpacity={0.4}
                label={{
                  value: `Standard Rate: $${minPrice}`,
                  fill: '#00FFFF',
                  fontSize: 8,
                  fontFamily: 'monospace',
                  position: 'insideBottomLeft',
                  offset: 5
                }}
              />
            )}

            {/* Bars for pricing */}
            <Bar yAxisId="price" dataKey="priceUsd" barSize={18}>
              {sortedData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isInflated ? "rgba(255, 51, 51, 0.7)" : "rgba(0, 255, 255, 0.75)"}
                  stroke={entry.isInflated ? "#FF3333" : "#00FFFF"}
                  strokeWidth={1}
                />
              ))}
            </Bar>

            {/* Line representing GDP (Purchasing Power index) */}
            <Line
              yAxisId="gdp"
              type="monotone"
              dataKey="gdpPerCapita"
              stroke="#F3F3F0"
              strokeWidth={1.5}
              dot={{ fill: '#F3F3F0', r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 border-t border-[#F3F3F0]/5 pt-2 select-none">
        <div className="flex gap-4">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-1.5 bg-[#00FFFF]"></span> Base Standard Rate
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-1.5 bg-[#FF3333]"></span> Dynamic Surcharged Rate
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-4 h-0.5 bg-[#F3F3F0]"></span> Host Location GDP per Capita
          </span>
        </div>
      </div>
    </div>
  );
}
