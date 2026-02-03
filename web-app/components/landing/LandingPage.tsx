'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactFullpage from '@fullpage/react-fullpage';
import { motion, AnimatePresence } from 'framer-motion';
import { BrandLogo } from '../ui/BrandLogo';

const Typewriter = ({ words }: { words: string[] }) => {
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(150);

  useEffect(() => {
    const i = loopNum % words.length;
    const fullText = words[i];

    const handleTyping = () => {
      setText(isDeleting 
        ? fullText.substring(0, text.length - 1) 
        : fullText.substring(0, text.length + 1)
      );

      setTypingSpeed(isDeleting ? 50 : 150);

      if (!isDeleting && text === fullText) {     
        setTimeout(() => setIsDeleting(true), 2000); 
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const timer = setTimeout(handleTyping, typingSpeed);
    return () => clearTimeout(timer);
  }, [text, isDeleting, loopNum, words, typingSpeed]);

  return (
    <span className="text-white font-light inline-block min-w-[300px] text-center">
      {text}
      <span className="animate-pulse text-white ml-1">|</span>
    </span>
  );
};

// --- Main Component ---
export const LandingPage = ({ onEnter }: { onEnter: () => void }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const fullpageApiRef = useRef<any>(null);

    const handleHeroWheel = useCallback((e: React.WheelEvent) => {
            if (showIntro || !fullpageApiRef.current) {
                    return;
            }

            if (e.deltaY > 0) {
                    e.preventDefault();
                    fullpageApiRef.current.moveSectionDown();
            }
    }, [showIntro]);

  // Mount check and Intro Timer
  useEffect(() => {
    setIsMounted(true);
    
    // Intro timer
    const timer = setTimeout(() => {
        setShowIntro(false);
    }, 3500);
    
    return () => clearTimeout(timer);
  }, []);

  // Re-enable scroll and rebuild when intro ends
  useEffect(() => {
      if (!showIntro && fullpageApiRef.current) {
          console.log('Intro finished - Rebuilding and Enabling Scroll');
          
          // Force rebuild to ensure DOM is measured correctly after intro removal
          fullpageApiRef.current.reBuild();
          
          // Explicitly enable scrolling
          fullpageApiRef.current.setAllowScrolling(true);
          fullpageApiRef.current.setKeyboardScrolling(true);
          
          // Force focus on the first section to ensure event listeners are active
          // This fixes the issue where scroll might be stuck on first load
          // fullpageApiRef.current.moveTo(1); // REMOVED: This might be causing a loop or reset
      }
  }, [showIntro]);

  // --- HORIZONTAL SCROLL LOGIC ---
  const handleSlideScroll = useCallback((e: WheelEvent) => {
      console.log('Wheel Event Triggered:', e.deltaY);
      const api = fullpageApiRef.current;
      
      if (!api) {
          console.log('API not ready');
          return;
      }

      const activeSection = document.querySelector('.fp-section.active');
      if (!activeSection) {
          console.log('No active section found');
          return;
      }

      const sectionIndex = Array.from(document.querySelectorAll('.fp-section')).indexOf(activeSection);
      console.log('Active Section Index:', sectionIndex);

      // Only work on sections with slides
      const slides = activeSection.querySelectorAll('.fp-slide');
      console.log('Slides count:', slides.length);
      
      if (slides.length === 0) {
          console.log('No slides in this section, returning (allowing default scroll)');
          return;
      }

      // Prevent default ONLY if we are in a section with slides
      console.log('Preventing default scroll and handling horizontal move');
      e.preventDefault();

      const activeSlide = activeSection.querySelector('.fp-slide.active');
      const slideIndex = activeSlide ? Array.from(slides).indexOf(activeSlide) : 0;
      console.log('Current Slide Index:', slideIndex);

      // Scroll Down -> Go Right
      if (e.deltaY > 0) { 
          if (slideIndex < slides.length - 1) {
              console.log('Moving Slide Right');
              api.moveSlideRight();
          } else {
              console.log('Last slide reached, moving section down');
              api.setAllowScrolling(true);
              api.moveSectionDown();
          }
      } 
      // Scroll Up -> Go Left
      else { 
          if (slideIndex > 0) {
              console.log('Moving Slide Left');
              api.moveSlideLeft();
          } else {
              console.log('First slide reached, moving section up');
              api.setAllowScrolling(true);
              api.moveSectionUp();
          }
      }
  }, []);

  // Events to attach/detach the wheel listener
  const afterLoad = (origin: any, destination: any, direction: any) => {
      console.log('afterLoad - Origin:', origin?.index, 'Destination:', destination.index);
      
      // Section 3 (Index 2): "How It Works" -> Enable horizontal scroll
      if (destination.index === 2) {
          console.log('Entering Slide Section (Index 2) - Disabling Vertical Scroll, Adding Listener');
          fullpageApiRef.current?.setAllowScrolling(false); 
          window.addEventListener('wheel', handleSlideScroll, { passive: false });
      } else {
          console.log('Entering Normal Section - Ensuring Vertical Scroll is ON, Removing Listener');
          fullpageApiRef.current?.setAllowScrolling(true);
          // Explicitly remove listener to be safe
          window.removeEventListener('wheel', handleSlideScroll);
      }
  };

  const onLeave = (origin: any, destination: any, direction: any) => {
      if (origin.index === 2) {
          fullpageApiRef.current?.setAllowScrolling(true);
          window.removeEventListener('wheel', handleSlideScroll);
      }
  };

  const onSlideLeave = (section: any, origin: any, destination: any, direction: any) => {
      if (origin.index === 2 && destination.index === 3 && direction === 'right') {
          fullpageApiRef.current?.setAllowScrolling(true);
          window.removeEventListener('wheel', handleSlideScroll);
          fullpageApiRef.current?.moveSectionDown();
          return false; 
      }
  };


  if (!isMounted) return null;

  return (
    <div className="relative w-full h-full">
      {/* 1. Intro Overlay */}
      <AnimatePresence>
        {showIntro && (
          <motion.div 
            key="intro-overlay"
            className="fixed inset-0 z-[100] bg-black" 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }} 
            // Blocks all pointer events while present
          />
        )}
      </AnimatePresence>

      {/* 2. Intro Logo */}
      {showIntro && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center pointer-events-none">
              <BrandLogo size="large" layoutIdPrefix="shared-" />
          </div>
      )}

      {/* 3. Background Video */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none -z-10">
          <div className="w-full h-full overflow-hidden relative">
              <div className="absolute inset-0 bg-black/60 z-10"></div>
              <video 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-full h-full object-cover opacity-50 mix-blend-screen"
              >
                  <source src="https://cdn.pixabay.com/video/2021/12/15/101416-657812490_large.mp4" type="video/mp4" />
              </video>
          </div>
      </div>

      {/* 4. Navbar */}
      <nav className="fixed top-0 w-full z-[200] px-6 md:px-12 py-6 flex justify-between items-center text-white">
         <div className="flex items-center gap-2 group cursor-pointer" onClick={() => fullpageApiRef.current?.moveTo(1)}>
            {!showIntro && (
                <BrandLogo size="small" layoutIdPrefix="shared-" />
            )}
            {showIntro && <div className="w-10 h-10 opacity-0"></div>} 
         </div>
         
         <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? -20 : 0 }}
            transition={{ duration: 0.8, delay: 1.8, ease: "easeOut" }}
            className="hidden md:flex items-center gap-8"
         >
             <button onClick={() => fullpageApiRef.current?.moveTo(2)} className="text-sm font-medium hover:text-gray-300 transition-colors">Market</button>
             <button onClick={() => fullpageApiRef.current?.moveTo(3)} className="text-sm font-medium hover:text-gray-300 transition-colors">How it Works</button>
             <button 
                onClick={onEnter}
                className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-full hover:bg-gray-200 transition-all hover:scale-105"
             >
                Launch App
             </button>
         </motion.div>
      </nav>

      {/* 5. FullPage React */}
      <ReactFullpage
        licenseKey={'gplv3-license'} 
        scrollingSpeed={1000}
        scrollBar={false}  
        autoScrolling={true}
        fitToSection={true}
        touchSensitivity={15}
        navigation={true}
        navigationPosition={'right'}
        controlArrows={false}
        slidesNavigation={false}
        credits={{ enabled: false, label: '', position: 'right' }}
        
        // Connect events
        afterLoad={afterLoad}
        onLeave={onLeave}
        onSlideLeave={onSlideLeave}
        
        // Initial Render Action - Ensure scroll is enabled by default
        afterRender={() => {
            console.log('afterRender Triggered');
            // If intro is still active, we might want to lock it, but let's be safe and default to unlocked for now
            // Or trust the useEffect above to handle the lock/unlock cycle.
            // Let's explicitly unlock here to be safe against initialization locks.
            if (fullpageApiRef.current) {
                 fullpageApiRef.current.setAllowScrolling(true);
                 fullpageApiRef.current.setKeyboardScrolling(true);
            }
        }}

        render={({ state, fullpageApi }) => {
          fullpageApiRef.current = fullpageApi;

          return (
            <ReactFullpage.Wrapper>
              
              {/* --- SECTION 1: HERO --- */}
                            <div className="section" onWheel={handleHeroWheel}>
                  <div className="relative h-full flex flex-col items-center justify-center text-center px-4 pt-20">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none -z-10 mix-blend-overlay"></div>
                    
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter mb-8 leading-[0.95] drop-shadow-2xl text-center flex flex-col items-center"
                    >
                        <span className="text-transparent font-light" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.7)' }}>The future is</span>
                        <Typewriter words={["predictable.", "automated.", "calculated.", "PredictlyAI."]} />
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-300 max-w-xl mx-auto mb-12 leading-relaxed font-light tracking-wide drop-shadow-lg text-center"
                    >
                        The world&apos;s first autonomous prediction layer.
                        <br className="hidden md:block" />
                        Outsmart the market with institutional-grade intelligence.
                    </motion.p>
                  </div>
              </div>

              {/* --- SECTION 2: DASHBOARD PREVIEW --- */}
              <div className="section">
                  <div className="w-full h-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 md:px-12 bg-black/90 overflow-hidden">
                      {/* Left: Text Content */}
                      <div className="flex-1 max-w-xl z-20">
                          <motion.div 
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                          >
                              <div className="flex items-center gap-3 mb-6">
                                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                                      <div className="w-6 h-6 bg-black rounded-full"></div>
                                  </div>
                                  <span className="font-bold text-2xl tracking-tighter text-white">PredictlyAI</span>
                              </div>
                              <h2 className="text-4xl md:text-6xl font-medium text-white tracking-tighter mb-6 leading-[0.95]">
                                  Professional <br/>
                                  <span className="text-gray-500">Intelligence.</span>
                              </h2>
                              <p className="text-lg text-gray-400 font-light leading-relaxed mb-8">
                                  Access the same tools used by institutional prediction markets. 
                                  Real-time monitoring, AI-driven probability analysis, and automated risk management.
                              </p>
                              
                              <div className="flex flex-row gap-12 mt-10 border-t border-white/10 pt-8">
                                  <div>
                                      <div className="text-3xl md:text-4xl font-medium text-white tracking-tighter mb-2">24/7</div>
                                      <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">Coverage</div>
                                  </div>
                                  <div>
                                      <div className="text-3xl md:text-4xl font-medium text-white tracking-tighter mb-2">94%</div>
                                      <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">Accuracy</div>
                                  </div>
                                  <div>
                                      <div className="text-3xl md:text-4xl font-medium text-white tracking-tighter mb-2">0.05s</div>
                                      <div className="text-xs text-gray-500 font-mono uppercase tracking-widest">Latency</div>
                                  </div>
                              </div>
                          </motion.div>
                      </div>

                      {/* Right: Dashboard Preview (Visual Only) */}
                      <motion.div 
                        initial={{ opacity: 0, x: 50, rotateY: -10 }}
                        whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                        transition={{ duration: 1 }}
                        className="flex-1 w-full max-w-[1000px] perspective-1000"
                      >
                           <div className="w-full aspect-[16/10] bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-[24px] overflow-hidden flex flex-col shadow-2xl relative select-none transform transition-transform hover:scale-[1.02] duration-500">
                              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-20 pointer-events-none mix-blend-overlay"></div>
                              <div className="flex items-start justify-between border-b border-[#262626]/50 p-4 bg-[#050505]/50 relative backdrop-blur-md">
                                 <div className="absolute right-6 top-6 opacity-20 pointer-events-none">
                                     <div className="flex items-center gap-2">
                                         <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                                             <div className="w-2.5 h-2.5 bg-black rounded-full"></div>
                                         </div>
                                         <span className="font-bold text-white tracking-tighter text-xs">PredictlyAI</span>
                                     </div>
                                 </div>
                                 <div className="flex gap-3 items-center w-full">
                                    <div className="relative shrink-0">
                                        <div className="w-10 h-10 rounded-xl border border-[#333] bg-[#111] flex items-center justify-center">
                                            <span className="font-bold text-white text-[10px]">BTC</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 blur-[6px] select-none">
                                       <div className="flex gap-2 mb-1">
                                          <span className="text-[8px] uppercase tracking-[0.2em] text-gray-400 font-mono font-medium flex items-center gap-2 border border-[#222] px-1.5 py-0.5 rounded-md bg-[#0A0A0A]">
                                             <span className="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                                             Analysis
                                          </span>
                                          <span className="border border-gray-700 text-gray-300 bg-gray-800/20 text-[8px] font-mono font-medium tracking-widest px-1.5 py-0.5 rounded-md">CRYPTO</span>
                                       </div>
                                       <h1 className="text-xl font-bold text-white leading-tight mb-1 tracking-tight font-sans">Bitcoin &gt; $100k by Dec 2025</h1>
                                       <div className="text-gray-400 text-[10px] font-mono flex items-center gap-2">
                                          <span className="text-white font-bold">&gt;</span>
                                          AI-driven pricing evaluation.
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="flex-1 p-4 grid grid-cols-3 gap-3 bg-[#050505]/50 backdrop-blur-md overflow-hidden">
                                  {/* Whale Radar - Full Width */}
                                  <div className="col-span-3">
                                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-between blur-[0.5px] hover:blur-0 transition-all duration-500 select-none group/radar">
                                          <div className="flex gap-4 text-[10px] font-mono text-blue-300">
                                              <span>WHALES BUYING: <b className="text-white blur-[2px] group-hover/radar:blur-0 transition-all duration-700">12</b></span>
                                              <span>WHALES SELLING: <b className="text-white blur-[2px] group-hover/radar:blur-0 transition-all duration-700">0</b></span>
                                              <span className="hidden sm:inline">RECENT BIG TRADES: <b className="text-white blur-[2px] group-hover/radar:blur-0 transition-all duration-700">5</b></span>
                                          </div>
                                          <div className="text-[8px] text-blue-500/50 uppercase tracking-widest flex items-center gap-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
                                              LIVE WHALE TRACKER
                                          </div>
                                      </div>
                                  </div>

                                  {/* Left Column: Intelligence + Analysis */}
                                  <div className="col-span-2 space-y-2">
                                      {/* Intelligence Report Header */}
                                      <div className="flex justify-between items-start border-b border-white/5 pb-2 blur-[1px] hover:blur-0 transition-all duration-500">
                                          <div>
                                              <div className="flex items-center gap-2 mb-1">
                                                  <h2 className="text-lg font-bold text-white tracking-tight">Intelligence Report</h2>
                                                  <span className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] font-mono text-gray-400">V2.0</span>
                                              </div>
                                              <div className="text-[10px] text-gray-500 font-mono flex items-center gap-2">
                                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                  MARKET OPEN | VOLUME $45.2M
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-gray-400 inline-block mb-1">
                                                  CONFIDENCE: <span className="text-white font-bold">HIGH</span>
                                              </div>
                                          </div>
                                      </div>

                                      {/* Main Analysis Card */}
                                      <div className="relative p-4 rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden group hover:border-white/20 transition-colors">
                                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 via-emerald-500/5 to-transparent opacity-100 blur-lg -z-10"></div>
                                          
                                          <div className="flex justify-between items-start mb-3">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-8 h-8 rounded-full border border-green-500/30 bg-green-500/10 flex items-center justify-center text-[10px] text-green-400 font-bold shadow-[0_0_15px_rgba(74,222,128,0.2)]">YES</div>
                                                  <div>
                                                      <h4 className="text-sm font-bold text-white font-sans tracking-tight">Outcome: Yes</h4>
                                                      <div className="flex gap-2 mt-1">
                                                          <span className="inline-flex text-[8px] font-bold tracking-widest px-1.5 py-0.5 uppercase border border-green-500/50 bg-green-500/20 text-green-400 rounded-[4px] shadow-[0_0_8px_rgba(74,222,128,0.2)]">Underpriced</span>
                                                          <span className="inline-flex text-[8px] font-bold tracking-widest px-1.5 py-0.5 uppercase border border-blue-500/30 bg-blue-500/10 text-blue-400 rounded-[4px]">High Vol</span>
                                                      </div>
                                                  </div>
                                              </div>
                                              <div className="text-right">
                                                  <div className="text-[8px] text-gray-500 uppercase font-mono mb-1 tracking-wider flex items-center justify-end gap-1">
                                                      <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                                      <span>AI Fair Value</span>
                                                  </div>
                                                  <div className="text-2xl font-black text-white font-mono leading-none tracking-tighter">87%</div>
                                                  <div className="text-[8px] text-green-400 font-mono mt-0.5">+12% DIVERGENCE</div>
                                              </div>
                                          </div>

                                          {/* Progress Bar */}
                                          <div className="relative h-1.5 bg-[#1a1a1a] w-full rounded-full mb-2 overflow-hidden">
                                              <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-emerald-400 w-[87%] rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)]"></div>
                                              <div className="absolute top-0 h-full w-0.5 bg-white/50 left-[75%] z-10"></div> {/* Market Marker */}
                                          </div>
                                          <div className="flex justify-between text-[8px] font-mono text-gray-500 mb-3 group/stats">
                                              <span className="blur-[1.5px] group-hover/stats:blur-0 transition-all duration-300">Market: 75%</span>
                                              <span className="text-white font-bold">PredictlyAI: 87%</span>
                                          </div>

                                          {/* Analysis Text */}
                                          <div className="p-2 rounded-lg bg-black/40 border border-white/5 text-[9px] text-gray-400 leading-relaxed font-mono truncate">
                                              <span className="text-blue-400 font-bold">&gt;</span> Strong momentum detected. Whale accumulation observed at $0.72...
                                          </div>
                                      </div>
                                  </div>

                                  {/* Right Column: Sidebar (Hot + News) */}
                                  <div className="col-span-1 space-y-2">
                                      {/* Hot Activities */}
                                      <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden relative group h-[calc(50%-4px)] flex flex-col justify-center">
                                          <div className="flex items-center justify-between mb-2">
                                              <div className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">Hot Activities</div>
                                              <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                                          </div>
                                          <div className="space-y-1.5 blur-[2px] opacity-50 group-hover:blur-[1px] transition-all duration-500">
                                              <div className="h-1 w-3/4 bg-white/20 rounded-full"></div>
                                              <div className="h-1 w-1/2 bg-white/10 rounded-full"></div>
                                              <div className="h-1 w-full bg-white/10 rounded-full"></div>
                                          </div>
                                      </div>

                                      {/* News */}
                                      <div className="p-3 rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden relative group h-[calc(50%-4px)] flex flex-col justify-center">
                                          <div className="flex items-center justify-between mb-2">
                                              <div className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">News</div>
                                              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                                          </div>
                                          <div className="space-y-1.5 blur-[2px] opacity-50 group-hover:blur-[1px] transition-all duration-500">
                                              <div className="h-1 w-full bg-white/20 rounded-full"></div>
                                              <div className="h-1 w-4/5 bg-white/10 rounded-full"></div>
                                              <div className="h-1 w-1/2 bg-white/10 rounded-full"></div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                           </div>
                      </motion.div>
                  </div>
              </div>

              {/* --- SECTION 3: HOW IT WORKS (SLIDES) --- */}
              <div className="section">
                  {/* Slide 1: Monitor */}
                  <div className="slide">
                      <div className="h-full flex flex-col justify-center items-center px-4 max-w-7xl mx-auto">
                          <div className="mb-12 text-center">
                              <motion.h2 
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-4"
                              >
                                Intelligence, Simplified.
                              </motion.h2>
                              <p className="text-gray-400 text-lg">Step 1: Real-time Surveillance</p>
                          </div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8 }}
                            className="group relative p-8 rounded-3xl bg-[#080808]/90 backdrop-blur-md border border-white/10 w-full max-w-2xl flex flex-col shadow-2xl"
                          >
                              <div className="mb-8">
                                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold mb-4 border border-white/20">1</div>
                                  <h3 className="text-2xl font-medium text-white mb-2">Monitor</h3>
                                  <p className="text-gray-400 text-sm leading-relaxed">We aggregate real-time data from prediction markets like Polymarket.</p>
                              </div>
                              <div className="mt-auto relative w-full h-40 bg-black/50 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center">
                                  <div className="absolute inset-0 bg-grid-white/[0.02]"></div>
                                  <div className="flex flex-col gap-2 w-full px-6">
                                      <div className="flex items-center justify-between text-xs text-gray-400 font-mono uppercase">
                                          <span>Source</span>
                                          <span>Status</span>
                                      </div>
                                      <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10 group hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors cursor-default">
                                          <span className="text-sm text-white group-hover:text-blue-400 transition-colors">Polymarket</span>
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                      </div>
                                      <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/10 group hover:border-purple-500/50 hover:bg-purple-500/10 transition-colors cursor-default">
                                          <span className="text-sm text-white group-hover:text-purple-400 transition-colors">Kalshi</span>
                                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"></div>
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                      </div>
                  </div>

                  {/* Slide 2: Analyze */}
                  <div className="slide">
                      <div className="h-full flex flex-col justify-center items-center px-4 max-w-7xl mx-auto">
                          <div className="mb-12 text-center">
                              <motion.h2 
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-4"
                              >
                                Deep Analysis
                              </motion.h2>
                              <p className="text-gray-400 text-lg">Step 2: Signal Processing</p>
                          </div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8 }}
                            className="group relative p-8 rounded-3xl bg-[#080808]/90 backdrop-blur-md border border-white/10 w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
                          >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                              <div className="mb-8 relative z-10">
                                  <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 font-bold mb-4 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]">2</div>
                                  <h3 className="text-2xl font-medium text-white mb-2">Analyze</h3>
                                  <p className="text-gray-400 text-sm leading-relaxed">Our AI processes thousands of news signals and market movements.</p>
                              </div>
                              <div className="mt-auto relative w-full h-40 bg-black/50 rounded-xl border border-white/10 overflow-hidden p-4 flex flex-col justify-end gap-3 z-10">
                                   <div className="flex items-end justify-between gap-1 h-20 px-2">
                                       {[40, 70, 50, 90, 60, 80, 50, 70, 90, 100].map((h, i) => (
                                           <div key={i} className="w-full bg-gradient-to-t from-violet-900/50 to-violet-500 rounded-t-sm hover:brightness-125 transition-all shadow-[0_0_10px_rgba(139,92,246,0.3)]" style={{ height: `${h}%` }}></div>
                                       ))}
                                   </div>
                                   <div className="flex justify-between text-[10px] text-gray-500 font-mono uppercase border-t border-white/10 pt-2">
                                       <span>Signal Strength</span>
                                       <span className="text-violet-400 font-bold shadow-violet-500/50">High (94%)</span>
                                   </div>
                              </div>
                          </motion.div>
                      </div>
                  </div>

                  {/* Slide 3: Forecast */}
                  <div className="slide">
                      <div className="h-full flex flex-col justify-center items-center px-4 max-w-7xl mx-auto">
                          <div className="mb-12 text-center">
                              <motion.h2 
                                initial={{ opacity: 0, filter: "blur(10px)" }}
                                whileInView={{ opacity: 1, filter: "blur(0px)" }}
                                transition={{ duration: 0.8 }}
                                className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-4"
                              >
                                Actionable Forecasts
                              </motion.h2>
                              <p className="text-gray-400 text-lg">Step 3: Execution</p>
                          </div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                            transition={{ duration: 0.8 }}
                            className="group relative p-8 rounded-3xl bg-[#080808]/90 backdrop-blur-md border border-white/10 w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden"
                          >
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                              <div className="mb-8 relative z-10">
                                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold mb-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.3)]">3</div>
                                  <h3 className="text-2xl font-medium text-white mb-2">Forecast</h3>
                                  <p className="text-gray-400 text-sm leading-relaxed">Receive actionable probabilities and sentiment analysis.</p>
                              </div>
                              <div className="mt-auto relative w-full h-40 bg-black/50 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center z-10">
                                  <div className="w-full max-w-[200px] p-4 rounded-lg bg-white/5 border border-white/20 flex flex-col gap-2 relative">
                                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-md -z-10"></div>
                                      <div className="flex justify-between items-center mb-1">
                                          <span className="text-[10px] text-gray-400 font-mono uppercase">Prediction</span>
                                          <span className="text-[10px] text-blue-400 font-bold">84% YES</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                          <div className="h-full w-[84%] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                      </div>
                                      <div className="flex justify-between items-center mt-1">
                                          <span className="text-[10px] text-gray-400">Confidence</span>
                                          <span className="text-[10px] text-green-400 font-bold">High</span>
                                      </div>
                                  </div>
                              </div>
                          </motion.div>
                      </div>
                  </div>

                  {/* Dummy Slide 4 */}
                  <div className="slide">
                      <div className="h-full w-full"></div>
                  </div>
              </div>

              {/* --- SECTION 4: FOOTER --- */}
              <div className="section">
                  <footer className="h-full flex flex-col justify-center bg-black/40 backdrop-blur-sm text-white px-6 md:px-12">
                      <div className="max-w-7xl mx-auto w-full">
                          <div className="flex flex-col gap-12 mb-12">
                              <h2 className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter leading-[0.9] mix-blend-exclusion">
                                  Predict <br />
                                  <span className="text-gray-400 hover:text-white transition-colors">the future.</span>
                              </h2>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 border-t border-white/10 pt-12">
                              {[
                                  { title: "Platform", links: ["Markets", "News", "Seismic", "Trending"] },
                                  { title: "Resources", links: ["Documentation", "API Reference", "Status", "Community"] },
                                  { title: "Company", links: ["About PredictlyAI", "Careers", "Legal", "Privacy"] },
                              ].map((col, i) => (
                                  <div key={i} className="flex flex-col gap-4">
                                      <h4 className="text-sm font-mono text-gray-500 uppercase tracking-widest">{col.title}</h4>
                                      <ul className="flex flex-col gap-2">
                                          {col.links.map((link, j) => (
                                              <li key={j}>
                                                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                                                      {link}
                                                  </a>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              ))}
                          </div>

                          <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-t border-white/10 pt-8">
                              <div>
                                  <div className="flex items-center gap-3 mb-2">
                                      <span className="text-xl font-bold tracking-tighter">PredictlyAI</span>
                                  </div>
                                  <p className="text-gray-500 text-sm max-w-md">
                                      Institutional-grade prediction markets.
                                  </p>
                              </div>
                              <div className="flex gap-4">
                                  {['Twitter', 'GitHub', 'Discord'].map((social, i) => (
                                      <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                                          <div className="w-3 h-3 bg-current rounded-sm"></div>
                                      </a>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </footer>
              </div>

            </ReactFullpage.Wrapper>
          );
        }}
      />
    </div>
  );
};
