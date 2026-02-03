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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showLanding, setShowLanding] = useState(true);
  const [url, setUrl] = useState('');
  const [showGuide, setShowGuide] = useState(false);
  const [showWhoAmI, setShowWhoAmI] = useState(false);

  useEffect(() => {
    // Check if we should skip landing page (e.g. returning from analyst page)
    const skipLanding = searchParams.get('skipLanding');
    if (skipLanding === 'true') {
        setShowLanding(false);
    }
  }, [searchParams]);

  if (showLanding) {
      return <LandingPage onEnter={() => setShowLanding(false)} />;
  }

  const handleAnalyze = (inputUrl: string) => {
    if (!inputUrl) return;
    router.push(`/analyst?url=${encodeURIComponent(inputUrl)}`);
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans bg-[#050505] text-white selection:bg-blue-500/30 selection:text-white overflow-x-hidden">
        
        {/* Dynamic Premium Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120vw] h-[100vh] bg-gradient-to-b from-blue-900/10 via-purple-900/5 to-transparent blur-[120px] opacity-40 animate-pulse-slow"></div>
            <div className="absolute bottom-[-20%] right-0 w-[80vw] h-[80vh] bg-gradient-to-t from-indigo-900/10 via-transparent to-transparent blur-[100px] opacity-30"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
        </div>

        {/* Minimal Navigation */}
        <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex justify-between items-center mix-blend-difference text-white">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
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
          
          <AnimatePresence mode="wait">
               <motion.div 
                 key="dashboard"
                 initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                 animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                 exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                 transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                 className="flex-1 flex flex-col relative"
               >
                  
                  <div className="mb-24 text-center space-y-8 max-w-3xl mx-auto">
                     <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.1 }}
                        className="flex justify-center mb-8"
                     >
                         <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/5 backdrop-blur-xl shadow-2xl">
                            <BrandLogo size="large" isAnimated={true} />
                         </div>
                     </motion.div>
                     
                     <motion.h1 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 pb-2"
                     >
                        Predict the Future.
                     </motion.h1>

                     <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-xl text-gray-400 font-light leading-relaxed max-w-xl mx-auto"
                     >
                       Institutional-grade prediction market analysis powered by autonomous AI agents.
                     </motion.p>
                  </div>

                  {/* Premium Search Input */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="w-full max-w-2xl mx-auto space-y-20"
                  >
                      <div className="relative group z-20">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                          <div className="relative flex items-center bg-[#0A0A0A]/80 border border-white/10 rounded-full p-2 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-[#0A0A0A]">
                              <div className="pl-6 pr-4 text-gray-500">
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                              </div>
                              <input 
                                  value={url}
                                  onChange={(e) => setUrl(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(url)}
                                  placeholder="Paste market URL..."
                                  className="flex-1 bg-transparent border-none text-white placeholder-gray-600 text-lg py-3 focus:outline-none focus:ring-0 font-light tracking-wide"
                              />
                              <div className="pr-2">
                                  <button 
                                      onClick={() => handleAnalyze(url)}
                                      className="bg-white text-black hover:bg-gray-200 transition-all rounded-full px-6 py-3 font-medium text-sm tracking-wide flex items-center gap-2"
                                  >
                                      Analyze
                                  </button>
                              </div>
                          </div>
                          
                          <div className="mt-6 flex justify-center gap-6 text-xs text-gray-500 font-mono uppercase tracking-widest opacity-60">
                              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Polymarket</span>
                              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Kalshi</span>
                          </div>
                      </div>

                      <div className="relative">
                          <TrendingMarkets onSelect={handleAnalyze} />
                      </div>
                  </motion.div>
               </motion.div>
          </AnimatePresence>
          
        </main>

        <SiteFooter />

        <AnimatePresence>
            {showGuide && <HowItWorks onClose={() => setShowGuide(false)} />}
            {showWhoAmI && <WhoAmI onClose={() => setShowWhoAmI(false)} />}
        </AnimatePresence>
    </div>
  );
}

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
