import React from 'react';

export const MinimalChart = ({ data }: { data: { label: string; value: number; color: string }[] }) => {
  const maxValue = Math.max(...data.map(d => d.value), 100);

  return (
    <div className="w-full h-32 flex items-end gap-2 pt-6">
      {data.map((item, idx) => (
        <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
          {/* Tooltip */}
          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#222] border border-[#333] px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-10 pointer-events-none">
            {item.label}: {item.value}%
          </div>
          
          {/* Bar */}
          <div 
            className="w-full rounded-t-sm transition-all duration-500 hover:opacity-80 relative overflow-hidden"
            style={{ 
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color 
            }}
          >
             {/* Shine effect */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          
          {/* Label */}
          <div className="mt-2 text-[9px] text-gray-500 uppercase tracking-wider truncate w-full text-center group-hover:text-white transition-colors">
            {item.label.split(' ')[0]}
          </div>
        </div>
      ))}
    </div>
  );
};
