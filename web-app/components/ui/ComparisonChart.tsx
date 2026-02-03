import React from 'react';

export const ComparisonChart = ({ data }: { data: { label: string; marketValue: number; aiValue: number; deviationColor: string }[] }) => {
  const maxValue = 100;

  return (
    <div className="w-full space-y-4 pt-2 pb-2">
      {data.map((item, idx) => (
        <div key={idx} className="group relative">
          {/* Tooltip */}
          <div className="absolute -top-10 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[#151515] border border-[#333] px-3 py-2 rounded-lg text-xs text-white whitespace-nowrap z-20 pointer-events-none shadow-xl">
             <div className="font-bold mb-1">{item.label}</div>
             <div className="flex justify-between gap-4 text-[10px] text-gray-400">
                <span>Market: <span className="text-white">{item.marketValue}%</span></span>
                <span>AI: <span style={{ color: item.deviationColor }}>{item.aiValue}%</span></span>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-20 text-[9px] text-gray-500 uppercase tracking-wider truncate font-mono group-hover:text-white transition-colors">
              {item.label}
            </div>
            <div className="flex-1">
              <div className="relative h-5 rounded-full bg-white/5 border border-white/10 overflow-hidden z-10">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]"></div>

                {/* Market Marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#222] border border-[#444] shadow-[0_0_6px_rgba(255,255,255,0.15)]"
                  style={{ left: `calc(${Math.min(100, Math.max(0, (item.marketValue / maxValue) * 100))}% - 6px)` }}
                ></div>

                {/* AI Marker (Brand Logo) */}
                <div
                  className="absolute top-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(${Math.min(100, Math.max(0, (item.aiValue / maxValue) * 100))}% - 7px)`
                  }}
                >
                  <div
                    className="w-4 h-4 rounded-full bg-white/90 border border-white/40 flex items-center justify-center"
                    style={{
                      boxShadow: `0 0 14px ${item.deviationColor}CC, 0 0 6px ${item.deviationColor}80`
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-24 flex items-center justify-end gap-2 text-[10px] font-mono relative z-20">
              <span className="text-gray-500">M</span>
              <span className="text-white">{item.marketValue}%</span>
              <span className="text-gray-500">AI</span>
              <span style={{ color: item.deviationColor }}>{item.aiValue}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
