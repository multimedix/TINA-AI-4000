
import React from 'react';
import { Button } from '../components/UI';

interface Props {
  onLoginSuccess: () => void;
}

const Login: React.FC<Props> = ({ onLoginSuccess }) => {
  
  const handleStart = () => {
    // Versuch, den Browser in den Vollbildmodus zu schalten
    // Das funktioniert, weil es durch eine Benutzerinteraktion (Klick) ausgelöst wird.
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().catch(err => {
        console.warn("Vollbildmodus konnte nicht gestartet werden:", err);
      });
    }

    // Direct entry without authentication logic
    onLoginSuccess();
  };

  return (
    <div className="flex items-center justify-center h-full bg-marien-900 p-4">
      <div className="bg-marien-800 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-marien-700 text-center relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-marien-500 via-marien-400 to-fun-blue"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-marien-600/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fun-blue/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Logo Section */}
        <div className="w-full flex justify-center mb-10 relative z-10">
          <div className="w-56 h-40 bg-gradient-to-br from-marien-600 to-marien-900 rounded-3xl border border-marien-500/30 shadow-float flex flex-col items-center justify-center relative group hover:scale-105 transition-transform duration-500">
             
             {/* Icon */}
             <div className="mb-3 p-3 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-marien-300">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" fill="rgba(20, 184, 166, 0.2)" />
                    <path d="M3 10h4l2-3 3 6 2-4 3 3" stroke="#5eead4" strokeWidth="2" />
               </svg>
             </div>
             
             <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                TINA <span className="text-marien-400">AI</span>
             </h1>
             <p className="text-[10px] font-bold text-marien-300 uppercase tracking-[0.3em] mt-2">Marienhof</p>
          </div>
        </div>

        {/* Greeting Text */}
        <div className="mb-10 relative z-10">
          <h1 className="text-2xl font-bold text-white mb-3">Willkommen zurück!</h1>
          <p className="text-marien-200 text-sm leading-relaxed">
            Deine intelligente Assistenz für Dokumentation<br/> und Planung ist bereit.
          </p>
        </div>
        
        {/* Start Button */}
        <div className="relative z-10">
          <Button 
            onClick={handleStart} 
            className="w-full py-4 text-xl shadow-glow shadow-marien-500/40 !rounded-2xl group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
               Starten 
               <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
            {/* Hover shine effect */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </Button>
          
          <p className="mt-8 text-[10px] text-marien-600 font-medium uppercase tracking-widest opacity-60">
            System Online • Version 2.4
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
