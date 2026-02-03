import React, { useState } from 'react';

export const Navbar = ({ activeView, onViewChange }: { activeView: string, onViewChange: (view: string) => void }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'analysis', label: 'Analysis' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <nav className="fixed w-full z-50 top-0 left-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3">
             <div className="w-14 h-14 rounded-xl overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                <img src="/image.jpg" alt="Logo" className="w-full h-full object-cover" />
             </div>
             <div>
                <span className="text-2xl font-bold tracking-tight text-white block leading-none">PredictlyAI</span>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400 block">Enterprise</span>
             </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`text-sm font-medium transition-colors duration-200 ${
                  activeView === item.id 
                    ? 'text-white' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Side: Profile & Actions */}
          <div className="hidden md:flex items-center gap-6">
             <div className="h-5 w-[1px] bg-white/10"></div>
             <div className="flex items-center gap-3 cursor-pointer group">
                <div className="text-right">
                   <div className="text-sm font-medium text-white group-hover:text-gray-200">John Doe</div>
                   <div className="text-xs text-gray-500">Admin</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all">
                   <span className="text-xs font-bold text-white">JD</span>
                </div>
             </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-4 rounded-md text-base font-medium ${
                  activeView === item.id 
                    ? 'bg-white/10 text-white' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="pt-4 pb-4 border-t border-white/10">
             <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">JD</span>
                   </div>
                </div>
                <div className="ml-3">
                   <div className="text-base font-medium leading-none text-white">John Doe</div>
                   <div className="text-sm font-medium leading-none text-gray-400 mt-1">john@enterprise.com</div>
                </div>
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};
