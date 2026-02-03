import React from 'react';
import { Card } from '../ui/Primitives';

interface AIVerdictProps {
  overallReliability: "Low" | "Medium" | "High";
  finalStatement: string;
  analystNotes: string[];
}

export const AIVerdict = ({ overallReliability, finalStatement, analystNotes }: AIVerdictProps) => {
  const isReliable = overallReliability === 'High';
  
  return (
    <div className="h-full flex flex-col bg-[#0A0A0A] border border-white/5 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.02] blur-[80px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <div className="p-4 border-b border-white/5 z-10 flex justify-between items-center bg-[#0A0A0A]/50 backdrop-blur-sm">
         <div className="flex items-center gap-3">
             <div className="relative flex items-center justify-center w-2 h-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
             </div>
             <h3 className="text-xs font-mono uppercase tracking-widest text-white/60">AI Verdict</h3>
         </div>
         <div className="flex items-center gap-2">
             <span className="text-[9px] font-mono text-white/30 uppercase">CONFIDENCE</span>
             <div className="flex gap-0.5">
                 {[1, 2, 3].map((i) => (
                     <div key={i} className={`w-1 h-3 rounded-sm ${
                         (overallReliability === 'Low' && i === 1) ||
                         (overallReliability === 'Medium' && i <= 2) ||
                         (overallReliability === 'High') 
                         ? 'bg-white' 
                         : 'bg-white/10'
                     }`} />
                 ))}
             </div>
         </div>
      </div>

      <div className="flex-1 p-6 relative z-10 flex flex-col justify-between">
         <div>
            <div className="mb-6">
                <div className="text-[10px] text-white/30 font-mono mb-2 uppercase tracking-widest">Analysis Conclusion</div>
                <h2 className="text-2xl md:text-3xl font-light text-white leading-tight tracking-tight">
                    {finalStatement}
                </h2>
            </div>
         </div>

         <div className="mt-auto pt-6 border-t border-white/5">
            <h4 className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-4">Key Observations</h4>
            <ul className="space-y-3">
               {analystNotes.slice(0, 3).map((note, i) => (
                  <li key={i} className="text-sm font-light text-white/70 flex items-start gap-3 group">
                     <span className="text-[10px] font-mono text-white/20 mt-1 group-hover:text-white/50 transition-colors">
                        {String(i + 1).padStart(2, '0')}
                     </span>
                     <span className="leading-relaxed">{note}</span>
                  </li>
               ))}
            </ul>
         </div>
      </div>
    </div>
  );
};
