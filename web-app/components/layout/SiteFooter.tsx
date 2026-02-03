'use client';

import { BrandLogo } from '@/components/ui/BrandLogo';

export const SiteFooter = () => {
  return (
    <footer className="w-full bg-black/40 backdrop-blur-sm text-white border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
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
                    <div className="mb-4">
                         <BrandLogo size="small" isAnimated={false} />
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
  );
};
