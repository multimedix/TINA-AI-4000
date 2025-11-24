
import React, { useState } from 'react';

interface Props {
  currentPage: string;
  onNavigate: (page: string) => void;
  onAction?: (action: string) => void;
}

const BottomNav: React.FC<Props> = ({ currentPage, onNavigate, onAction }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { id: 'calendar', label: 'Erfassung', icon: '📝' },
    { id: 'protocol', label: 'Auswertung', icon: '📊' },
    { id: 'mood', label: 'Mood', icon: '🧘‍♀️' },
    { id: 'info', label: 'Info', icon: '📚' },
  ];

  const handleNav = (id: string) => {
    onNavigate(id);
    setIsExpanded(false);
  };

  return (
    <>
      {/* EXPANDABLE MENU OVERLAY (Backdrop) */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* EXPANDABLE MENU CONTENT */}
      <div className={`fixed bottom-24 left-4 right-4 z-50 transition-all duration-300 transform ${isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-marien-900 text-white rounded-3xl p-6 shadow-float border border-marien-700/50">
            <h3 className="text-marien-300 text-xs font-bold uppercase tracking-widest mb-4 border-b border-marien-800 pb-2">Schnellzugriff</h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => { onNavigate('calendar'); setIsExpanded(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-marien-800 hover:bg-marien-700 transition-colors">
                    <span className="text-2xl">📅</span>
                    <div className="text-left">
                        <div className="font-bold text-sm">Heute</div>
                        <div className="text-[10px] text-marien-300">Zur Erfassung</div>
                    </div>
                </button>
                <button onClick={() => { onNavigate('mood'); setIsExpanded(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-marien-800 hover:bg-marien-700 transition-colors">
                    <span className="text-2xl">❤️</span>
                    <div className="text-left">
                        <div className="font-bold text-sm">Check-in</div>
                        <div className="text-[10px] text-marien-300">Wie geht's dir?</div>
                    </div>
                </button>
                <button onClick={() => { onNavigate('info'); setIsExpanded(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-marien-800 hover:bg-marien-700 transition-colors">
                    <span className="text-2xl">✅</span>
                    <div className="text-left">
                        <div className="font-bold text-sm">Aufgaben</div>
                        <div className="text-[10px] text-marien-300">To-Dos prüfen</div>
                    </div>
                </button>
                 <button onClick={() => { window.print(); setIsExpanded(false); }} className="flex items-center gap-3 p-3 rounded-xl bg-marien-800 hover:bg-marien-700 transition-colors">
                    <span className="text-2xl">🖨️</span>
                    <div className="text-left">
                        <div className="font-bold text-sm">Drucken</div>
                        <div className="text-[10px] text-marien-300">Aktuelle Seite</div>
                    </div>
                </button>
            </div>
        </div>
      </div>

      {/* MAIN BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-6 z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] print:hidden">
        <div className="flex justify-between items-center max-w-lg mx-auto h-20 relative">
            
            {/* Left Items */}
            <button 
                onClick={() => handleNav('calendar')}
                className={`flex flex-col items-center gap-1 w-16 transition-all ${currentPage === 'calendar' ? 'text-marien-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <span className="text-2xl">📝</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Start</span>
            </button>

            <button 
                onClick={() => handleNav('protocol')}
                className={`flex flex-col items-center gap-1 w-16 transition-all ${currentPage === 'protocol' ? 'text-marien-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <span className="text-2xl">📊</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Daten</span>
            </button>

            {/* CENTER ACTION BUTTON */}
            <div className="relative -top-6">
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={`w-16 h-16 rounded-full bg-gradient-to-br from-marien-500 to-marien-700 text-white shadow-glow flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-45 scale-110' : 'hover:scale-105'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </button>
            </div>

            {/* Right Items */}
            <button 
                onClick={() => handleNav('mood')}
                className={`flex flex-col items-center gap-1 w-16 transition-all ${currentPage === 'mood' ? 'text-marien-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <span className="text-2xl">🧘‍♀️</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Mood</span>
            </button>

            <button 
                onClick={() => handleNav('info')}
                className={`flex flex-col items-center gap-1 w-16 transition-all ${currentPage === 'info' ? 'text-marien-600 scale-110' : 'text-gray-400 hover:text-gray-600'}`}
            >
                <span className="text-2xl">📚</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Info</span>
            </button>

        </div>
      </div>
    </>
  );
};

export default BottomNav;
