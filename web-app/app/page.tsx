'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingMarkets } from '@/components/features/TrendingMarkets';
import { HowItWorks } from '@/components/features/HowItWorks';
import { WhoAmI } from '@/components/features/WhoAmI';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { LandingPage } from '@/components/landing/LandingPage';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { SmoothScroll } from '@/components/ui/SmoothScroll';
import { MinimalDashboard } from '@/components/features/MinimalDashboard';
import { Button } from '@/components/ui/Primitives';
import { Leaderboard } from '@/components/features/Leaderboard';
import { HotActivities } from '@/components/features/HotActivities';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLanding, setShowLanding] = useState(true);
  
  // Navigation State
  const [view, setView] = useState<'markets' | 'activity' | 'leaderboard'>('markets');

  // Analysis State (Moved from /analyst/page.tsx)
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const [showGuide, setShowGuide] = useState(false);
  const [showWhoAmI, setShowWhoAmI] = useState(false);

  useEffect(() => {
    // Check if we should skip landing page
    const skipLanding = searchParams.get('skipLanding');
    if (skipLanding === 'true') {
        setShowLanding(false);
    }
    
    // Check for URL param to trigger auto-analysis (backward compatibility)
    const urlParam = searchParams.get('url');
    if (urlParam) {
        setShowLanding(false);
        setUrl(urlParam);
        handleAnalyze(urlParam);
    }
  }, [searchParams]);

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

  if (showLanding) {
      return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); 
      
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

  const handleClearAnalysis = () => {
      setResult(null);
      setError('');
      setLoading(false);
      setUrl('');
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-[#050505] text-white selection:bg-blue-500/30 selection:text-white overflow-x-hidden">
        
        {/* Dynamic Premium Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[100vh] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent blur-[120px] opacity-40 animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-0 w-[80vw] h-[80vh] bg-gradient-to-t from-indigo-900/10 via-transparent to-transparent blur-[100px] opacity-30"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
        </div>

        {/* Top Navbar */}
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => { handleClearAnalysis(); setView('markets'); }}>
                 <BrandLogo size="small" layoutIdPrefix="nav-" isAnimated={false} />
            </div>

            {/* Middle: Navigation */}
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                <button 
                    onClick={() => { handleClearAnalysis(); setView('markets'); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'markets' && !result ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Markets
                </button>
                <button 
                    onClick={() => { handleClearAnalysis(); setView('activity'); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'activity' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Activity
                </button>
                <button 
                    onClick={() => { handleClearAnalysis(); setView('leaderboard'); }}
                    className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${view === 'leaderboard' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                >
                    Leaderboard
                </button>
            </div>

            {/* Right: Search & Profile */}
            <div className="flex items-center gap-4">
               <div className="hidden lg:flex items-center bg-[#0F0F0F] border border-white/10 rounded-lg px-3 py-1.5 w-64 focus-within:border-white/20 transition-colors">
                   <svg className="w-4 h-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                   <input 
                       value={url}
                       onChange={(e) => setUrl(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(url)}
                       placeholder="Paste URL to analyze..."
                       className="bg-transparent border-none text-xs text-white placeholder-gray-500 focus:outline-none w-full"
                   />
               </div>
               <button 
                 onClick={() => setShowWhoAmI(true)}
                 className="text-xs font-medium text-gray-400 hover:text-white transition-colors"
               >
                 About
               </button>
            </div>
        </nav>

        {/* Main Content Area */}
        <div className="min-h-screen pt-24 px-4 md:px-8 pb-20 max-w-[1400px] mx-auto w-full">
            <AnimatePresence mode="wait">
                {/* CASE 1: SHOW ANALYSIS RESULT OR LOADING */}
                {(result || loading || error) ? (
                    <motion.div 
                        key="analysis"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full"
                    >
                         <div className="mb-6 flex items-center gap-2 text-sm text-gray-500 cursor-pointer hover:text-white transition-colors" onClick={() => { handleClearAnalysis(); setView('markets'); }}>
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                             Back to Markets
                         </div>

                         {loading && (
                           <div className="h-[60vh] flex flex-col items-center justify-center">
                              <div className="relative w-16 h-16 mb-6">
                                  <div className="absolute inset-0 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                                  <div className="absolute inset-0 border-r-2 border-purple-500/50 rounded-full animate-spin-slow"></div>
                              </div>
                              <div className="text-blue-400 font-mono text-xs tracking-widest uppercase animate-pulse mb-2">
                                {elapsedTime < 5 ? 'Connecting...' : 
                                 elapsedTime < 15 ? 'Analyzing Options...' : 
                                 'Processing Intelligence...'}
                              </div>
                              <div className="text-gray-600 font-mono text-[10px]">{elapsedTime}s</div>
                           </div>
                         )}

                         {error && (
                            <div className="p-8 bg-red-500/5 border border-red-500/20 text-red-200 rounded-2xl text-center max-w-xl mx-auto">
                              <div className="font-semibold mb-2">Analysis Failed</div>
                              <div className="text-sm opacity-70 mb-6">{error}</div>
                              <Button onClick={() => handleAnalyze(url)} className="bg-red-500/10 hover:bg-red-500/20 text-red-300">Retry</Button>
                            </div>
                         )}

                         {result && !loading && (
                            <MinimalDashboard
                             result={result}
                             onOpenGuide={() => setShowGuide(true)}
                             onSelect={handleAnalyze}
                             onRefresh={handleRefresh}
                             isRefreshing={isRefreshing}
                            />
                         )}
                    </motion.div>
                ) : (
                    /* CASE 2: SHOW VIEWS */
                    <motion.div 
                        key={view}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-8"
                    >
                        {view === 'markets' && (
                            <>
                                {/* Featured Hero Banner - Visual Only */}
                                <div className="w-full h-80 rounded-2xl relative overflow-hidden flex flex-col justify-end p-8 md:p-12 group">
                                     {/* Background with Gradient and Noise */}
                                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-[#050505] to-blue-900/20 z-0"></div>
                                     <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay"></div>
                                     
                                     {/* Animated Glow Orbs */}
                                     <motion.div 
                                        animate={{ 
                                            scale: [1, 1.2, 1],
                                            opacity: [0.3, 0.5, 0.3],
                                        }}
                                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full"
                                     />
                                     <motion.div 
                                        animate={{ 
                                            scale: [1, 1.1, 1],
                                            opacity: [0.2, 0.4, 0.2],
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                                        className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/10 blur-[100px] rounded-full"
                                     />

                                     {/* Content */}
                                     <div className="relative z-10 max-w-3xl">
                                         <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="flex items-center gap-3 mb-4"
                                         >
                                             <span className="px-3 py-1 bg-white/5 border border-white/10 text-white/70 text-[10px] font-mono uppercase tracking-[0.2em] rounded-full backdrop-blur-md">
                                                 Market Intelligence
                                             </span>
                                             <div className="h-px w-12 bg-white/20"></div>
                                         </motion.div>
                                         
                                         <motion.h1 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-4xl md:text-6xl font-medium text-white mb-6 leading-[1.1] tracking-tight"
                                         >
                                             <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                                                 Predict the future
                                             </span>
                                             <br />
                                             <span className="font-light text-white/40 italic">
                                                 before it happens.
                                             </span>
                                         </motion.h1>

                                         <motion.p 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                            className="text-sm md:text-base text-gray-400 max-w-xl leading-relaxed font-light"
                                         >
                                             Advanced AI models analyzing millions of data points to provide institutional-grade probability forecasts for global events.
                                         </motion.p>
                                     </div>

                                     {/* Decorative Grid Lines */}
                                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)] pointer-events-none"></div>
                                </div>

                                {/* Market List */}
                                <div className="w-full">
                                    <TrendingMarkets onSelect={handleAnalyze} />
                                </div>
                            </>
                        )}

                        {view === 'activity' && (
                            <div className="w-full max-w-4xl mx-auto mt-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Market Activity</h2>
                                <HotActivities onSelect={handleAnalyze} />
                            </div>
                        )}

                        {view === 'leaderboard' && (
                            <Leaderboard />
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        <AnimatePresence>
            {showGuide && <HowItWorks onClose={() => setShowGuide(false)} />}
            {showWhoAmI && <WhoAmI onClose={() => setShowWhoAmI(false)} />}
        </AnimatePresence>
    </div>
  );
}

// Keeping original exports intact
import { Suspense } from 'react';

export default function Home() {
  return (
    <SmoothScroll>
      <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
        <HomeContent />
      </Suspense>
    </SmoothScroll>
  );
}
