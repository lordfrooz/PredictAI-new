import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export const NotificationBar = ({ message, onClose }: { message: string; onClose: () => void }) => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation to finish before unmounting
      setTimeout(onClose, 300); 
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div className={`fixed bottom-6 left-6 z-[9999] transition-all duration-300 ease-out transform ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
    }`}>
      <div className="bg-[#1a1a1a]/90 backdrop-blur-md border border-[#333] text-gray-200 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 min-w-[250px]">
        <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
        <span className="text-sm font-medium tracking-wide">{message}</span>
      </div>
    </div>,
    document.body
  );
};
