'use client';

import { motion } from 'framer-motion';

interface BrandLogoProps {
    size?: "small" | "large";
    layoutIdPrefix?: string;
    isAnimated?: boolean;
}

export const BrandLogo = ({ size = "small", layoutIdPrefix = "", isAnimated = true }: BrandLogoProps) => {
    const Container = isAnimated ? motion.div : 'div';
    const Element = isAnimated ? motion.div : 'div';
    const Text = isAnimated ? motion.span : 'span';
    const Ring = isAnimated ? motion.div : 'div';

    return (
        <Container 
          {...(isAnimated ? {
              layoutId: `${layoutIdPrefix}brand-logo-container`,
              initial: { opacity: 1 },
              animate: { opacity: 1 },
              transition: { duration: 2.0, ease: [0.22, 1, 0.36, 1] }
          } : {})}
          className={`flex items-center gap-3 relative z-[500] ${isAnimated ? '' : ''}`} 
          style={{ zIndex: 500 }}
        >
            <Element 
                {...(isAnimated ? {
                    layoutId: `${layoutIdPrefix}brand-logo-circle`,
                    // Intro: Logo comes from scale 0. Navbar: Just morphs
                    initial: size === 'large' ? { scale: 0, opacity: 0 } : {},
                    animate: size === 'large' ? { scale: 1, opacity: 1 } : {},
                    transition: { duration: 1.2, ease: "backOut" }
                } : {})}
                className={`${size === 'large' ? 'w-24 h-24' : 'w-10 h-10'} bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] relative`}
            >
                {size === 'large' && (
                    <Ring
                        {...(isAnimated ? {
                            animate: { rotate: 360 },
                            transition: { duration: 3.5, repeat: Infinity, ease: 'linear' }
                        } : {})}
                        className="absolute inset-[-6px] rounded-full pointer-events-none"
                        style={{
                            background: 'conic-gradient(from 0deg, rgba(255,255,255,0.95), rgba(255,255,255,0.15), rgba(255,255,255,0.95))',
                            filter: 'blur(6px)'
                        }}
                    />
                )}
                {/* Neon Pulse Effect - Only visible in large (Intro) mode */}
                {size === 'large' && isAnimated && (
                    <motion.div 
                        initial={{ opacity: 0.5, scale: 1 }}
                        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full bg-blue-500 blur-xl -z-10"
                    ></motion.div>
                )}
                
                <Element 
                    {...(isAnimated ? {
                        layoutId: `${layoutIdPrefix}brand-logo-dot`
                    } : {})}
                    className={`${size === 'large' ? 'w-14 h-14' : 'w-6 h-6'} bg-black rounded-full relative z-10`}
                ></Element>
            </Element>
            <Text 
              {...(isAnimated ? {
                  layoutId: `${layoutIdPrefix}brand-text`,
                  // Intro: Text slides in from right with delay. Navbar: Just morphs
                  initial: size === 'large' ? { x: 50, opacity: 0 } : {},
                  animate: size === 'large' ? { x: 0, opacity: 1 } : {},
                  transition: { duration: 0.8, delay: 0.5, ease: "easeOut" }
              } : {})}
              className={`font-bold text-white tracking-tighter ${size === 'large' ? 'text-7xl' : 'text-2xl'}`}
            >
                PredictlyAI
            </Text>
        </Container>
    );
};
