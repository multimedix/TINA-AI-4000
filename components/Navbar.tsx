
import React, { useRef, useState } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  selectedDate?: string;
  onDateSelect?: (date: string) => void;
  saveStatus?: 'saved' | 'unsaved' | 'saving';
}

const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate, selectedDate, onDateSelect, saveStatus }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dateObj = selectedDate ? new Date(selectedDate) : new Date();
  const weekday = dateObj.toLocaleDateString('de-DE', { weekday: 'long' }).toUpperCase();
  const dateNum = dateObj.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const fullDate = `${weekday}, ${dateNum}`;
  const dateInputRef = useRef<HTMLInputElement>(null);

  const changeDate = (offset: number) => {
    if (!selectedDate || !onDateSelect) return;
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    onDateSelect(d.toISOString().split('T')[0]);
  };

  const triggerDatePicker = () => {
     if (dateInputRef.current) {
         try { dateInputRef.current.showPicker(); } catch { dateInputRef.current.click(); }
     }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuNavigate = (page: string) => {
    onNavigate(page);
    setIsMenuOpen(false);
  };

  const icons = {
    calendar: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    protocol: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
    mood: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    )
  };

  const navItems = [
    { id: 'calendar', label: 'Erfassung', icon: icons.calendar },
    { id: 'protocol', label: 'Auswertung', icon: icons.protocol },
    { id: 'mood', label: 'Mood', icon: icons.mood },
    { id: 'info', label: 'Info', icon: icons.info },
  ];

  return (
    <>
      <nav className="w-full no-print sticky top-0 z-40 pt-2 px-2 md:pt-4 md:px-4 pointer-events-none">
        <div className="max-w-7xl mx-auto bg-marien-900 rounded-2xl shadow-float border border-marien-700/50 flex flex-col overflow-hidden pointer-events-auto min-h-[110px]">
          
          {/* === ROW 1: HEADER (Logo | Date | Status) === */}
          <div className="w-full bg-marien-950 border-b border-marien-800 flex items-center justify-between p-3 md:p-4 relative min-h-[80px]">
            
            {/* LEFT: Logo Area (Enlarged) - CLICKABLE TRIGGER */}
            <div 
              className="shrink-0 flex items-center gap-2 md:gap-3 z-10 w-auto cursor-pointer group"
              onClick={toggleMenu}
              title="Hauptmenü öffnen"
            >
               <div className="w-14 h-12 md:w-16 md:h-14 bg-gradient-to-br from-marien-500 to-marien-700 rounded-xl flex items-center justify-center shadow-lg shadow-marien-500/20 text-white relative overflow-hidden group-hover:scale-105 transition-transform duration-300">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="animate-pulse-slow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7 md:w-9 md:h-9">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        <path d="M3 10h4l2-3 3 6 2-4 3 3" className="text-marien-200" strokeWidth="1.5" />
                    </svg>
                  </div>
               </div>
               <div className="hidden sm:flex flex-col leading-none justify-center group-hover:opacity-80 transition-opacity">
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl md:text-3xl font-black text-white tracking-tight">TINA AI</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-marien-400 uppercase tracking-widest">Marienhof</span>
               </div>
            </div>

            {/* CENTER: Date Navigation */}
            <div className="flex-1 absolute left-0 top-0 w-full h-full flex items-center justify-center pointer-events-none">
                 <div className="flex items-center gap-3 md:gap-6 pointer-events-auto bg-marien-950/80 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none rounded-2xl px-3 py-1">
                     <button 
                        onClick={() => changeDate(-1)}
                        className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl bg-marien-900 hover:bg-marien-800 border border-marien-700 hover:border-fun-yellow text-fun-yellow transition-all active:scale-95 shadow-lg group shrink-0"
                        title="Vorheriger Tag"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 group-hover:-translate-x-0.5 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                     </button>

                     <div className="flex flex-col items-center text-center justify-center min-w-[150px] md:min-w-[240px] cursor-pointer group" onClick={triggerDatePicker}>
                        {onDateSelect && (
                            <input 
                              ref={dateInputRef}
                              type="date" 
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full -z-10" 
                              value={selectedDate || ''}
                              onChange={(e) => onDateSelect(e.target.value)}
                            />
                        )}
                        <span className="text-[10px] md:text-xs font-bold text-marien-500 uppercase tracking-[0.25em] mb-0.5 group-hover:text-marien-300 transition-colors">Dokumentation</span>
                        <span className="text-2xl md:text-4xl font-black text-white tracking-tight whitespace-nowrap group-hover:text-marien-100 transition-colors">
                          {fullDate}
                        </span>
                     </div>

                     <button 
                         onClick={() => changeDate(1)}
                         className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl bg-marien-900 hover:bg-marien-800 border border-marien-700 hover:border-fun-yellow text-fun-yellow transition-all active:scale-95 shadow-lg group shrink-0"
                         title="Nächster Tag"
                     >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-0.5 transition-transform">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                     </button>
                 </div>
            </div>

            {/* RIGHT: Status Indicator */}
            <div className="shrink-0 z-10 flex justify-end min-w-[80px]">
               {saveStatus && (
                 <div className={`h-6 px-2.5 rounded-lg border flex items-center gap-1.5 shadow-sm transition-all ${
                    saveStatus === 'saved' 
                      ? 'bg-marien-800 border-marien-600 text-marien-100' 
                      : saveStatus === 'unsaved' 
                      ? 'bg-red-900/40 border-red-800 text-red-200' 
                      : 'bg-blue-900/40 border-blue-800 text-blue-200'
                 }`}>
                    <div className={`w-1.5 h-1.5 rounded-full shadow-[0_0_5px_currentColor] ${
                        saveStatus === 'saved' ? 'bg-green-500' : 
                        saveStatus === 'unsaved' ? 'bg-red-500 animate-pulse' : 
                        'bg-blue-500 animate-ping'
                    }`}></div>
                    <span className="text-[9px] font-bold uppercase tracking-wider">
                       {saveStatus === 'saved' ? 'Gespeichert' : saveStatus === 'unsaved' ? 'Ungespeichert' : 'Speichert'}
                    </span>
                 </div>
               )}
            </div>
          </div>

          {/* === ROW 2: TABS (HIDDEN ON MOBILE, VISIBLE ON DESKTOP) === */}
          <div className="hidden md:flex w-full bg-marien-900/50 overflow-x-auto no-scrollbar">
             {navItems.map(item => (
               <button 
                 key={item.id}
                 onClick={() => onNavigate(item.id)}
                 className={`flex-1 flex items-center justify-center gap-3 py-4 px-2 transition-all duration-300 relative group overflow-hidden border-r border-marien-800/30 last:border-0 min-w-[100px]
                   ${currentPage === item.id 
                     ? 'bg-marien-600 text-white shadow-[inset_0_2px_15px_rgba(0,0,0,0.1)]' 
                     : 'text-marien-300 hover:bg-marien-800 hover:text-white'}`}
               >
                  <span className={`transition-transform duration-300 ${currentPage === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                  </span>
                  <span className={`text-xs md:text-sm font-bold uppercase tracking-wider ${currentPage === item.id ? 'text-white' : ''}`}>
                    {item.label}
                  </span>
                  
                  {currentPage === item.id && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-fun-yellow shadow-[0_-2px_8px_rgba(234,179,8,0.5)]"></div>
                  )}
               </button>
             ))}
          </div>

        </div>
      </nav>

      {/* === OVERLAY MENU === */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-marien-950/90 backdrop-blur-xl animate-fade-in flex flex-col">
           {/* Menu Header */}
           <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-marien-500 rounded-xl flex items-center justify-center text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Menü</h2>
                    <p className="text-marien-300 text-xs font-bold uppercase tracking-widest">Navigation</p>
                 </div>
              </div>
              <button 
                onClick={toggleMenu}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </button>
           </div>

           {/* Menu Content */}
           <div className="flex-1 overflow-y-auto p-6 md:p-12">
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 
                 {/* Main Pages */}
                 {navItems.map(item => (
                   <div 
                      key={item.id}
                      onClick={() => handleMenuNavigate(item.id)}
                      className="group bg-gradient-to-br from-white/5 to-white/10 hover:from-marien-500 hover:to-marien-700 border border-white/10 rounded-3xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-glow flex items-center gap-5"
                   >
                      <div className="w-16 h-16 rounded-2xl bg-white/10 group-hover:bg-white/20 flex items-center justify-center text-marien-300 group-hover:text-white transition-colors">
                          {React.cloneElement(item.icon as React.ReactElement, { className: 'w-8 h-8' })}
                      </div>
                      <div>
                         <h3 className="text-xl font-bold text-white mb-1 group-hover:translate-x-1 transition-transform">{item.label}</h3>
                         <p className="text-sm text-marien-300 group-hover:text-marien-100">Öffne {item.label}</p>
                      </div>
                   </div>
                 ))}

                 {/* Separator / Sub-Section Title (Visual only) */}
                 <div className="col-span-full mt-6 mb-2">
                    <h3 className="text-marien-400 font-bold uppercase tracking-widest text-sm border-b border-white/10 pb-2">Schnellzugriff</h3>
                 </div>

                 {/* Sub Sections (Deep Links to Info Page features) */}
                 <div 
                    onClick={() => handleMenuNavigate('info')}
                    className="group bg-purple-900/30 hover:bg-purple-600 border border-purple-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex items-center gap-5"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Aufgaben</h3>
                        <p className="text-xs text-purple-200">Globales To-Do</p>
                    </div>
                 </div>

                 <div 
                    onClick={() => handleMenuNavigate('info')}
                    className="group bg-blue-900/30 hover:bg-blue-600 border border-blue-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex items-center gap-5"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 text-blue-300 flex items-center justify-center group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Kalender</h3>
                        <p className="text-xs text-blue-200">Termine & Planung</p>
                    </div>
                 </div>

                 <div 
                    onClick={() => handleMenuNavigate('info')}
                    className="group bg-indigo-900/30 hover:bg-indigo-600 border border-indigo-500/30 rounded-3xl p-6 cursor-pointer transition-all duration-300 flex items-center gap-5"
                 >
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Wissensdatenbank</h3>
                        <p className="text-xs text-indigo-200">Notizen & Infos</p>
                    </div>
                 </div>

              </div>
           </div>
           
           <div className="p-6 text-center border-t border-white/10 text-marien-500 text-xs">
              Systemmenü • Tina AI Marienhof
           </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
