import React, { useState } from 'react';
import { Badge } from '../ui/Primitives';

export const HowItWorks = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* Backdrop - clickable to close */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto transition-opacity duration-300" 
        onClick={onClose}
      ></div>

      {/* Side Panel */}
      <div className="w-full max-w-md h-full bg-[#050505] border-l border-[#222] relative shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out animate-slide-in-right flex flex-col">
        
        {/* Noise Texture */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none"></div>
        
        {/* Header */}
        <div className="p-6 border-b border-[#222] flex justify-between items-center relative z-10 bg-[#050505]/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.5)]">?</div>
            <div>
                <h2 className="text-lg font-bold text-white font-mono tracking-widest uppercase">Guidebook</h2>
                <div className="text-[10px] text-gray-500 font-mono">SYSTEM V2.0 MANUAL - PAGE {step}/2</div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative z-10 space-y-8">
          
          {step === 1 ? (
            <>
              {/* Section 1: The Core Logic */}
              <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-white pl-3">1. Analytical Framework</h3>
                    
                    <div className="space-y-4">
                        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222] group hover:border-white/30 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold font-mono text-xs">WHITE INDICATOR</span>
                            <Badge variant="success" className="bg-white/10 text-white border-white/50 text-[10px]">UNDERVALUED</Badge>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed font-mono">
                            Model identifies a <strong className="text-white">statistical divergence</strong>. Market price implies lower probability than data suggests. <span className="text-white underline decoration-dotted">Potential Upside</span>.
                            </p>
                        </div>

                        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222] group hover:border-red-500/30 transition-colors">
                            <div className="flex justify-between items-center mb-2">
                            <span className="text-red-400 font-bold font-mono text-xs">RED INDICATOR</span>
                            <Badge variant="danger" className="bg-red-900/10 text-red-400 border-red-500/30 text-[10px]">OVERVALUED</Badge>
                            </div>
                            <p className="text-xs text-gray-400 leading-relaxed font-mono">
                            Market pricing exceeds calculated probability. Suggests <span className="text-red-400">inflated premium</span>. High risk of mean reversion.
                            </p>
                        </div>
                    </div>
              </div>

              <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-blue-500 pl-3">2. Market Dynamics</h3>
                    <ul className="space-y-3">
                        <li className="bg-[#0A0A0A] p-3 rounded border border-[#222] flex gap-3 items-start">
                            <span className="text-red-400 font-bold font-mono text-[10px] shrink-0 mt-0.5">HIGH CONCENTRATION</span>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Elevated trading volume on a single outcome may lead to price volatility.</p>
                        </li>
                        <li className="bg-[#0A0A0A] p-3 rounded border border-[#222] flex gap-3 items-start">
                            <span className="text-yellow-400 font-bold font-mono text-[10px] shrink-0 mt-0.5">TIME SENSITIVITY</span>
                            <p className="text-[10px] text-gray-500 leading-relaxed">Proximity to event deadline increases impact of new information.</p>
                        </li>
                    </ul>
              </div>

              {/* Section 2: Dashboard Anatomy */}
              <div className="space-y-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-gray-600 pl-3">3. Visual Intelligence</h3>
                    
                    <ul className="space-y-4">
                        <li className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded bg-[#111] flex items-center justify-center border border-[#333] shrink-0 text-yellow-400 font-bold font-mono text-xs">M</div>
                            <div>
                                <h4 className="text-white font-bold font-mono text-xs">Market (Yellow Marker)</h4>
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                    Current trading price on prediction markets. Crowd consensus.
                                </p>
                            </div>
                        </li>
                        
                        <li className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded bg-[#111] flex items-center justify-center border border-[#333] shrink-0 text-white font-bold font-mono text-xs">AI</div>
                            <div>
                                <h4 className="text-white font-bold font-mono text-xs">AI Model (White Bar)</h4>
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                    Proprietary probability calculation based on alternative data.
                                </p>
                            </div>
                        </li>

                        <li className="flex gap-4 items-start">
                            <div className="w-6 h-6 rounded bg-[#111] flex items-center justify-center border border-[#333] shrink-0 text-green-400 font-bold font-mono text-xs">%</div>
                            <div>
                                <h4 className="text-white font-bold font-mono text-xs">Value Gap</h4>
                                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                                    Spread between AI and Market. 
                                    <span className="text-green-400 block mt-0.5">+ Gap = Undervalued</span>
                                    <span className="text-red-400 block">- Gap = Overvalued</span>
                                </p>
                            </div>
                        </li>
                    </ul>
              </div>

                <div className="mt-8 p-4 bg-gradient-to-br from-white/5 to-transparent rounded-xl border border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-20 text-2xl">??</div>
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Interpretation Guidelines</h4>
                    <ul className="list-disc list-inside text-[10px] text-gray-300 font-mono space-y-1.5">
                        <li>Target <span className="text-white font-bold">High Confidence</span> scores (&gt;75%).</li>
                        <li>Monitor <span className="text-green-400">Value Gap</span> &gt; 10%.</li>
                        <li>Avoid "Crowded Trade" alerts.</li>
                    </ul>
                </div>
            </>
          ) : (
            <>
              {/* PAGE 2: AI Methodology */}
              <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-white pl-3">4. Adaptive Scoring Engine</h3>
                  
                  <p className="text-xs text-gray-400 leading-relaxed font-mono mb-6">
                    Our <strong className="text-white">Probability Engine</strong> is not static. It automatically detects the market type (Sports, Politics, Crypto) and adjusts its weighting algorithm to prioritize the most relevant data vectors.
                  </p>

                  <div className="space-y-3">
                      {/* Politics Profile */}
                      <div className="bg-[#0A0A0A] p-4 rounded border border-[#222]">
                          <div className="flex justify-between mb-2">
                              <span className="text-xs text-white font-bold font-mono">TYPE: POLITICS</span>
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/50 text-[9px]">NEWS DRIVEN</Badge>
                          </div>
                          <div className="flex gap-1 h-1.5 w-full bg-[#222] rounded-full overflow-hidden mb-3">
                              <div className="h-full bg-purple-500 w-[45%]"></div>
                              <div className="h-full bg-blue-500 w-[40%]"></div>
                              <div className="h-full bg-gray-500 w-[15%]"></div>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">
                              <strong className="text-white">Heavy News & Polls Focus (45%).</strong> Political markets are highly sensitive to narrative shifts and polling data. Fundamentals (40%) and Momentum (15%) play secondary roles.
                          </p>
                      </div>

                      {/* Sports Profile */}
                      <div className="bg-[#0A0A0A] p-4 rounded border border-[#222]">
                          <div className="flex justify-between mb-2">
                              <span className="text-xs text-white font-bold font-mono">TYPE: SPORTS</span>
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/50 text-[9px]">STATS DRIVEN</Badge>
                          </div>
                          <div className="flex gap-1 h-1.5 w-full bg-[#222] rounded-full overflow-hidden mb-3">
                              <div className="h-full bg-orange-500 w-[70%]"></div>
                              <div className="h-full bg-purple-500 w-[20%]"></div>
                              <div className="h-full bg-gray-500 w-[10%]"></div>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">
                              <strong className="text-white">Extreme Fundamentals Focus (70%).</strong> Team stats, injuries, and historical performance dominate. News (20%) and Momentum (10%) have minimal impact unless critical (e.g., star player injury).
                          </p>
                      </div>

                      {/* Crypto/Finance Profile */}
                      <div className="bg-[#0A0A0A] p-4 rounded border border-[#222]">
                          <div className="flex justify-between mb-2">
                              <span className="text-xs text-white font-bold font-mono">TYPE: CRYPTO & FINANCE</span>
                              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/50 text-[9px]">BALANCED</Badge>
                          </div>
                          <div className="flex gap-1 h-1.5 w-full bg-[#222] rounded-full overflow-hidden mb-3">
                              <div className="h-full bg-blue-500 w-[50%]"></div>
                              <div className="h-full bg-purple-500 w-[30%]"></div>
                              <div className="h-full bg-gray-500 w-[20%]"></div>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed">
                              <strong className="text-white">Balanced Approach.</strong> Fundamentals (50%) provide the baseline, while News (30%) and Momentum (20%) capture market sentiment and trend following.
                          </p>
                      </div>
                  </div>
              </div>

              <div className="space-y-6 animate-fade-in">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 border-l-2 border-gray-600 pl-3">5. Confidence Interval</h3>
                  
                  <div className="bg-[#111] p-4 rounded-xl border border-[#333] relative overflow-hidden">
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12 opacity-20"></div>
                       <div className="flex justify-between items-end mb-4 relative z-10">
                           <div>
                               <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Confidence Score</div>
                               <div className="text-3xl font-black text-white font-mono">87<span className="text-sm text-gray-600">%</span></div>
                           </div>
                           <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">HIGH CERTAINTY</Badge>
                       </div>
                       <div className="h-1.5 w-full bg-[#222] rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-gray-600 to-white w-[87%]"></div>
                       </div>
                       <p className="mt-3 text-[10px] text-gray-400 leading-relaxed">
                           Scores above 75% indicate strong convergence across all 4 vectors. Scores below 40% suggest conflicting data or high uncertainty.
                       </p>
                  </div>
              </div>
            </>
          )}

        </div>
        
        {/* Footer Navigation */}
        <div className="p-4 border-t border-[#222] bg-[#0A0A0A] shrink-0 relative z-10 flex gap-4">
            {step === 2 && (
                <button 
                    onClick={() => setStep(1)} 
                    className="flex-1 py-3 bg-[#111] text-gray-300 font-bold font-mono text-xs uppercase tracking-widest hover:bg-[#222] hover:text-white transition-colors rounded-sm border border-[#333]"
                >
                    &lt; Previous
                </button>
            )}
            
            {step === 1 ? (
                <button 
                    onClick={() => setStep(2)} 
                    className="flex-1 py-3 bg-white text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-sm"
                >
                    Next: Methodology &gt;
                </button>
            ) : (
                <button 
                    onClick={onClose} 
                    className="flex-1 py-3 bg-white text-black font-bold font-mono text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors rounded-sm"
                >
                    Close Guide
                </button>
            )}
        </div>
      </div>
    </div>
  );
};
