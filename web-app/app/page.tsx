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
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center gap-2 p-1.5 bg-[#0F0F0F]/80 border border-white/5 rounded-full backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                <button 
                    onClick={() => { handleClearAnalysis(); setView('markets'); }}
                    className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 relative overflow-hidden ${
                        view === 'markets' && !result 
                        ? 'text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {view === 'markets' && !result && (
                        <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    <span className="relative z-10">Markets</span>
                </button>
                <button 
                    onClick={() => { handleClearAnalysis(); setView('activity'); }}
                    className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 relative overflow-hidden ${
                        view === 'activity' 
                        ? 'text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {view === 'activity' && (
                        <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    <span className="relative z-10">Activity</span>
                </button>
                <button 
                    onClick={() => { handleClearAnalysis(); setView('leaderboard'); }}
                    className={`px-5 py-2 rounded-full text-xs font-medium transition-all duration-300 relative overflow-hidden ${
                        view === 'leaderboard' 
                        ? 'text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                    {view === 'leaderboard' && (
                        <motion.div layoutId="nav-bg" className="absolute inset-0 bg-white rounded-full" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                    )}
                    <span className="relative z-10">Leaderboard</span>
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
                                {/* Featured Hero Banner - High-End Future Monolith */}
                                <div className="w-full h-[500px] rounded-3xl relative overflow-hidden flex flex-col justify-center p-8 md:p-16 group border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black">
                                     
                                     {/* 1. Cinematic Background Video */}
                                     <div className="absolute inset-0 z-0">
                                         <video 
                                            autoPlay 
                                            loop 
                                            muted 
                                            playsInline 
                                            className="w-full h-full object-cover opacity-30 mix-blend-screen scale-110"
                                         >
                                             <source src="https://cdn.pixabay.com/video/2019/05/20/23788-337895475_large.mp4" type="video/mp4" />
                                         </video>
                                         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                                     </div>

                                     {/* 2. Floating Particles */}
                                     <div className="absolute inset-0 z-0">
                                         {[...Array(20)].map((_, i) => (
                                             <motion.div
                                                 key={i}
                                                 initial={{ y: Math.random() * 500, x: Math.random() * 1000, opacity: 0 }}
                                                 animate={{ 
                                                     y: [Math.random() * 500, Math.random() * 500],
                                                     x: [Math.random() * 1000, Math.random() * 1000],
                                                     opacity: [0, Math.random() * 0.5, 0] 
                                                 }}
                                                 transition={{ duration: Math.random() * 10 + 10, repeat: Infinity, ease: "linear" }}
                                                 className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
                                             />
                                         ))}
                                     </div>

                                     {/* 3. 3D Perspective Grid */}
                                     <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:linear-gradient(to_bottom,transparent_0%,black_40%,transparent_100%)] opacity-20 transform perspective-1000 rotateX(60deg) scale(2)"></div>

                                     {/* 4. Top Spotlight */}
                                     <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-white/10 to-transparent blur-[100px] pointer-events-none"></div>

                                     {/* Content Container with Glassmorphism */}
                                     <div className="relative z-10 max-w-4xl mx-auto text-center">
                                         
                                         {/* Badge */}
                                         <motion.div 
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.05)] mb-8 hover:bg-white/10 transition-colors cursor-default"
                                         >
                                             {/* Mini Animated Brand Logo */}
                                             <div className="relative w-5 h-5 flex items-center justify-center">
                                                 {/* Rotating Outer Ring */}
                                                 <motion.div
                                                     animate={{ rotate: 360 }}
                                                     transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                                     className="absolute inset-[-4px] rounded-full border-[1.5px] border-transparent border-t-white/60 border-r-white/20"
                                                 />
                                                 
                                                 {/* Reverse Rotating Inner Ring */}
                                                 <motion.div
                                                     animate={{ rotate: -360 }}
                                                     transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                                                     className="absolute inset-[-1px] rounded-full border border-white/10 border-b-white/40"
                                                 />

                                                 {/* Core Logo */}
                                                 <div className="w-full h-full bg-white rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                                     <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                                                 </div>
                                             </div>

                                             <span className="text-[11px] font-mono text-gray-200 uppercase tracking-[0.25em] font-bold">
                                                 Next Gen Intelligence
                                             </span>
                                         </motion.div>
                                         
                                         {/* Hero Title */}
                                         <motion.h1 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                                            className="text-5xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600 mb-8 tracking-tighter drop-shadow-2xl"
                                            style={{ textShadow: "0 0 40px rgba(255,255,255,0.1)" }}
                                         >
                                             PREDICT THE FUTURE
                                         </motion.h1>

                                         {/* Subtitle */}
                                         <motion.p 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed font-light mb-10"
                                         >
                                             Harness the power of <span className="text-white font-medium border-b border-white/20 pb-0.5">institutional-grade AI</span> to analyze millions of data points and forecast global events with precision.
                                         </motion.p>

                                         {/* Action Area */}
                                         <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.7 }}
                                            className="flex flex-col md:flex-row items-center justify-center gap-6"
                                         >
                                             <div className="flex items-center gap-8 text-xs font-mono text-gray-500 uppercase tracking-widest">
                                                 <div className="flex items-center gap-2">
                                                     <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                     <span>Live Analysis</span>
                                                 </div>
                                                 <div className="w-px h-4 bg-white/10"></div>
                                                 <div className="flex items-center gap-2">
                                                     <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                                     <span>Real-time Data</span>
                                                 </div>
                                             </div>
                                         </motion.div>
                                     </div>
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
