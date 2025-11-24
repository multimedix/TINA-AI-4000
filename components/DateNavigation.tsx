
import React from 'react';
import { Button } from './UI';

interface Props {
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
  className?: string;
}

export const DateNavigation: React.FC<Props> = ({ onPrev, onToday, onNext, className }) => {
  return (
    <div className={`flex justify-between items-stretch gap-4 h-24 md:h-32 ${className || ''} pointer-events-auto`}>
        <Button 
          onClick={onPrev} 
          className="!flex-1 !rounded-3xl bg-marien-800/80 backdrop-blur-md hover:bg-marien-700 text-white shadow-lg border border-marien-700/50 flex flex-col items-center justify-center gap-2 group transition-all duration-300 hover:-translate-y-1 active:scale-95"
        >
           <span className="text-3xl group-hover:-translate-x-1 transition-transform">←</span>
           <span className="text-sm uppercase font-bold tracking-widest opacity-80">Gestern</span>
        </Button>

        <Button 
          onClick={onToday} 
          className="!flex-[1.2] !rounded-3xl bg-gradient-to-b from-marien-400 to-marien-600 hover:from-marien-300 hover:to-marien-500 text-white shadow-glow border-t border-white/20 flex flex-col items-center justify-center gap-2 transform -translate-y-4 group transition-all duration-300 hover:-translate-y-5 active:scale-95"
        >
           <span className="text-5xl drop-shadow-md animate-pulse-slow">☀️</span>
           <span className="text-lg uppercase font-black tracking-widest drop-shadow-sm">Heute</span>
        </Button>
        
        <Button 
          onClick={onNext} 
          className="!flex-1 !rounded-3xl bg-marien-800/80 backdrop-blur-md hover:bg-marien-700 text-white shadow-lg border border-marien-700/50 flex flex-col items-center justify-center gap-2 group transition-all duration-300 hover:-translate-y-1 active:scale-95"
        >
           <span className="text-3xl group-hover:translate-x-1 transition-transform">→</span>
           <span className="text-sm uppercase font-bold tracking-widest opacity-80">Morgen</span>
        </Button>
    </div>
  );
};