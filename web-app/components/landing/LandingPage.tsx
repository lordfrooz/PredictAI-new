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

  // Events to attach/detach the wheel listener
  // (Horizontal scroll logic removed as requested)

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
