'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MinimalDashboard } from '@/components/features/MinimalDashboard';
import { HowItWorks } from '@/components/features/HowItWorks';
import { WhoAmI } from '@/components/features/WhoAmI';
import { Button } from '@/components/ui/Primitives';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { SmoothScroll } from '@/components/ui/SmoothScroll';

function AnalystContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialUrl = searchParams.get('url') || '';
  
  const [url, setUrl] = useState(initialUrl);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showWhoAmI, setShowWhoAmI] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (initialUrl) {
        handleAnalyze(initialUrl);
    }
  }, [initialUrl]);

  // Timer for elapsed time during loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading || isRefreshing) {
      setElapsedTime(0);
      timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [loading, isRefreshing]);

  const handleAnalyze = async (inputUrl: string, forceRefresh = false) => {
    if (!inputUrl) return;
    
    if (forceRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
      setResult(null);
    }
    setError('');

    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
      
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl, forceRefresh }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Analysis failed');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('Request timed out. The market may have too many options. Try again or choose a simpler market.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    if (url) {
      handleAnalyze(url, true);
    }
  };

  const handleNewAnalysis = (newUrl: string) => {
      if (newUrl) {
          setUrl(newUrl);
          handleAnalyze(newUrl);
      }
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-black text-white selection:bg-white/20 selection:text-white overflow-x-hidden">
        
        {/* Dynamic Premium Background - Monochrome */}
        <div className="fixed inset-0 pointer-events-none z-0 bg-black">
            {/* Main top glow - subtle white light source */}
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] bg-gradient-to-b from-white/[0.08] via-white/[0.02] to-transparent blur-[150px]"></div>
            
            {/* Secondary atmospheric glows */}
            <div className="absolute top-[10%] left-0 w-[40vw] h-[40vh] bg-white/[0.02] blur-[100px] rounded-full"></div>
            <div className="absolute top-[5%] right-0 w-[40vw] h-[40vh] bg-white/[0.02] blur-[100px] rounded-full"></div>
            
            {/* Bottom Ambient */}
            <div className="absolute bottom-0 w-full h-[30vh] bg-gradient-to-t from-white/[0.02] to-transparent blur-[100px]"></div>

            {/* Noise texture for texture */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
        </div>

        {/* Minimal Navigation */}
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white">
            <div 
                className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => router.push('/')}
            >
                <span className="text-xs font-mono tracking-widest uppercase">PredictlyAI v2.0</span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
               <button 
                 onClick={() => setShowWhoAmI(true)}
                 className="text-xs font-medium hover:text-gray-300 transition-colors tracking-wide"
               >
                 About
               </button>
            </div>
        </nav>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex flex-col p-6 md:p-12 max-w-7xl mx-auto w-full pt-32">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-6xl mx-auto"
            >
                 <div className="flex items-center justify-between mb-12">
                     <button 
                       onClick={() => router.push('/?skipLanding=true')}
                       className="flex items-center text-gray-500 hover:text-white transition-colors text-xs group font-mono uppercase tracking-wider"
                     >
                       <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                       </svg>
                       Back
                     </button>

                     <div className="flex items-center gap-4">
                         <div className="hidden md:flex relative group w-64">
                            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-1.5 transition-all hover:bg-white/10">
                                <input 
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleNewAnalysis(url)}
                                    placeholder="Analyze another..."
                                    className="flex-1 bg-transparent border-none text-white placeholder-gray-500 text-xs focus:outline-none"
                                />
                            </div>
                        </div>
                     </div>
                 </div>

                 {loading && (
                   <div className="h-[60vh] flex flex-col items-center justify-center">
                      <div className="relative w-20 h-20 mb-8">
                          <div className="absolute inset-0 border-t-2 border-white/20 rounded-full animate-spin"></div>
                          <div className="absolute inset-0 border-r-2 border-white/60 rounded-full animate-spin-slow"></div>
                      </div>
                      <div className="text-gray-400 font-mono text-xs tracking-[0.3em] animate-pulse mb-2">
                        {elapsedTime < 5 ? 'FETCHING MARKET DATA' : 
                         elapsedTime < 15 ? 'AI ANALYZING OPTIONS' : 
                         elapsedTime < 30 ? 'GENERATING INSIGHTS' : 
                         'PROCESSING COMPLEX MARKET'}
                      </div>
                      <div className="text-gray-500 font-mono text-[10px]">{elapsedTime}s</div>
                      {elapsedTime > 30 && (
                        <div className="text-gray-600 font-mono text-[10px] mt-4 max-w-xs text-center">
                          Large markets with many options take longer to analyze
                        </div>
                      )}
                   </div>
                 )}

                 {error && (
                    <div className="p-8 bg-white/5 border border-white/10 text-white rounded-3xl text-center max-w-xl mx-auto backdrop-blur-md">
                      <div className="font-medium text-lg mb-2">Temporarily Unavailable</div>
                      <div className="text-sm opacity-50 mb-6">AI analysis is currently busy. Please try again in a moment.</div>
                      <Button variant="outline" onClick={() => handleNewAnalysis(url)} className="bg-white/5 border-white/20 hover:bg-white/10 text-white">Try Again</Button>
                    </div>
                 )}

                  {result && !loading && (
                    <MinimalDashboard
                     result={result}
                     onOpenGuide={() => setShowGuide(true)}
                     onSelect={handleNewAnalysis}
                     onRefresh={handleRefresh}
                     isRefreshing={isRefreshing}
                    />
                  )}
            </motion.div>
        </main>

        <SiteFooter />

        <AnimatePresence>
            {showGuide && <HowItWorks onClose={() => setShowGuide(false)} />}
            {showWhoAmI && <WhoAmI onClose={() => setShowWhoAmI(false)} />}
        </AnimatePresence>
    </div>
  );
}

export default function AnalystPage() {
  return (
    <SmoothScroll>
      <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono">Loading Analyst...</div>}>
        <AnalystContent />
      </Suspense>
    </SmoothScroll>
  );
}
