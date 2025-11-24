
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArbeitsEintrag, DienstTyp, PauseDauer, Bewertung, Notiz, KalenderEintrag, Aufgabe, KalenderTyp } from '../types';
import { Button, Input, Select, Textarea } from './UI';
import { saveEntry, getCalendarEvents, saveCalendarEvents, getGlobalTasks, saveGlobalTasks } from '../services/storageService';

interface Props {
  entry: ArbeitsEintrag;
  onSave: () => void; 
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDateSelect: (date: string) => void;
  onSaveStatusChange: (status: 'saved' | 'unsaved' | 'saving') => void;
}

type SaveStatus = 'saved' | 'unsaved' | 'saving';

const COLLEAGUES = ["Tina", "Gaby", "Rezija", "Klaas", "Conny", "Sandra", "Teamleitung", "Chefin"];

const DailyEntryForm: React.FC<Props> = ({ entry: initialEntry, onSave, onPrev, onNext, onToday, onDateSelect, onSaveStatusChange }) => {
  const [entry, setEntry] = useState<ArbeitsEintrag>(initialEntry);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  
  // Note System State
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [expandedNoteIds, setExpandedNoteIds] = useState<string[]>([]);

  // Dashboard State
  const [allEvents, setAllEvents] = useState<KalenderEintrag[]>([]);
  const [globalTasks, setGlobalTasks] = useState<Aufgabe[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const topRef = useRef<HTMLDivElement>(null);

  // Initial load & Migration
  useEffect(() => {
    let adaptedEntry = { ...initialEntry };
    
    // Fix missing colleagues
    if (!adaptedEntry.mitarbeiter || adaptedEntry.mitarbeiter.length < COLLEAGUES.length) {
      const padded = [...(adaptedEntry.mitarbeiter || [])];
      while (padded.length < COLLEAGUES.length) padded.push(false);
      adaptedEntry.mitarbeiter = padded;
    }

    // Fix missing ratings
    if (!adaptedEntry.mitarbeiterStimmung || adaptedEntry.mitarbeiterStimmung.length < COLLEAGUES.length) {
       const paddedRatings = [...(adaptedEntry.mitarbeiterStimmung || [])];
       while (paddedRatings.length < COLLEAGUES.length) paddedRatings.push(5);
       adaptedEntry.mitarbeiterStimmung = paddedRatings;
    }

    // MIGRATION: String to Notiz[]
    const rawVorkommnisse = adaptedEntry.vorkommnisse as unknown;
    if (typeof rawVorkommnisse === 'string') {
        if (rawVorkommnisse.length > 0) {
            adaptedEntry.vorkommnisse = [{
                id: Date.now().toString(),
                titel: "Allgemeine Notiz",
                text: rawVorkommnisse,
                erstelltAm: new Date().toISOString()
            }];
        } else {
            adaptedEntry.vorkommnisse = [];
        }
    }

    setEntry(adaptedEntry);
    setSaveStatus('saved');
    setExpandedNoteIds([]); // Reset expansions on new day
    
    // Load Dashboard Data
    loadDashboardData();
  }, [initialEntry]);

  const loadDashboardData = async () => {
      const events = await getCalendarEvents();
      const tasks = await getGlobalTasks();
      setAllEvents(events);
      setGlobalTasks(tasks);
  };

  // Sync with parent
  useEffect(() => {
    onSaveStatusChange(saveStatus);
  }, [saveStatus, onSaveStatusChange]);

  // --- AUTO SAVE LOGIC ---
  useEffect(() => {
    if (saveStatus !== 'unsaved') return;

    const timeoutId = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        await saveEntry(entry);
        setTimeout(() => setSaveStatus('saved'), 500);
      } catch (e) {
        console.error("Autosave failed", e);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [entry, saveStatus]);

  // Helper to calculate net working time
  const calculateNetTime = useCallback((start: string, end: string, pauseMin: string) => {
    if (!start || !end) return "00:00";
    
    const [startH, startM] = start.split(':').map(val => parseInt(val, 10) || 0);
    const [endH, endM] = end.split(':').map(val => parseInt(val, 10) || 0);
    const pause = parseInt(pauseMin, 10) || 0;

    let startTotalMins = startH * 60 + startM;
    let endTotalMins = endH * 60 + endM;

    if (endTotalMins < startTotalMins) {
      endTotalMins += 24 * 60;
    }

    const grossDuration = endTotalMins - startTotalMins;
    let netMinutes = grossDuration - pause;
    if (netMinutes < 0) netMinutes = 0;

    const h = Math.floor(netMinutes / 60);
    const m = netMinutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, []);

  const updateField = (field: keyof ArbeitsEintrag, value: any) => {
    setEntry(prev => {
      const next = { ...prev, [field]: value };
      
      if (field === 'arbeitsBeginn' || field === 'arbeitsEnde' || field === 'pausenDauer') {
        next.arbeitsZeitNetto = calculateNetTime(
          field === 'arbeitsBeginn' ? value : prev.arbeitsBeginn,
          field === 'arbeitsEnde' ? value : prev.arbeitsEnde,
          field === 'pausenDauer' ? value : prev.pausenDauer
        );
      }
      return next;
    });
    setSaveStatus('unsaved');
  };

  // --- NOTES FUNCTIONS ---
  const addNote = () => {
      if (!newNoteTitle.trim() && !newNoteText.trim()) return;
      
      const note: Notiz = {
          id: Date.now().toString() + Math.random(),
          titel: newNoteTitle.trim() || "Notiz",
          text: newNoteText,
          erstelltAm: new Date().toISOString()
      };
      
      // Ensure vorkommnisse is array
      const currentNotes = Array.isArray(entry.vorkommnisse) ? entry.vorkommnisse : [];
      updateField('vorkommnisse', [note, ...currentNotes]);
      
      setNewNoteTitle("");
      setNewNoteText("");
      // Auto expand the new note
      setExpandedNoteIds(prev => [...prev, note.id]);
  };

  const deleteNote = (id: string) => {
      const currentNotes = Array.isArray(entry.vorkommnisse) ? entry.vorkommnisse : [];
      updateField('vorkommnisse', currentNotes.filter(n => n.id !== id));
  };

  const updateNote = (id: string, field: 'titel' | 'text', val: string) => {
      const currentNotes = Array.isArray(entry.vorkommnisse) ? entry.vorkommnisse : [];
      const updated = currentNotes.map(n => n.id === id ? { ...n, [field]: val } : n);
      updateField('vorkommnisse', updated);
  };

  const toggleNote = (id: string) => {
      setExpandedNoteIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  // --- DASHBOARD FUNCTIONS ---
  
  // Tasks
  const addTask = async () => {
      if (!newTaskText.trim()) return;
      const newTask: Aufgabe = { id: Date.now().toString(), text: newTaskText, erledigt: false };
      const updated = [...globalTasks, newTask];
      setGlobalTasks(updated);
      await saveGlobalTasks(updated);
      setNewTaskText("");
  };

  const toggleTask = async (id: string) => {
      const updated = globalTasks.map(t => t.id === id ? { ...t, erledigt: !t.erledigt } : t);
      setGlobalTasks(updated);
      await saveGlobalTasks(updated);
  };

  const deleteTask = async (id: string) => {
      const updated = globalTasks.filter(t => t.id !== id);
      setGlobalTasks(updated);
      await saveGlobalTasks(updated);
  };

  // Events
  const updateEvent = async (id: string, field: 'titel' | 'datum', val: string) => {
      const updated = allEvents.map(e => e.id === id ? { ...e, [field]: val } : e);
      setAllEvents(updated);
      await saveCalendarEvents(updated);
  };

  const deleteEvent = async (id: string) => {
      if (window.confirm("Termin wirklich löschen?")) {
          const updated = allEvents.filter(e => e.id !== id);
          setAllEvents(updated);
          await saveCalendarEvents(updated);
      }
  };
  
  // Filter for dashboard
  const todayStr = new Date().toISOString().split('T')[0];
  const futureEvents = allEvents
    .filter(e => e.datum >= todayStr)
    .sort((a,b) => a.datum.localeCompare(b.datum));


  // Logic for coloring and splitting working time
  const [netHours, netMinutes] = entry.arbeitsZeitNetto.split(':').map(Number);
  const totalMinutes = (netHours || 0) * 60 + (netMinutes || 0);
  
  // 8 hours = 480 minutes
  const standardMinutes = 480;
  const normalMinutes = Math.min(totalMinutes, standardMinutes);
  const overtimeMinutes = Math.max(0, totalMinutes - standardMinutes);

  const formatMinutesToHHMM = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const normalString = formatMinutesToHHMM(normalMinutes);
  const overtimeString = formatMinutesToHHMM(overtimeMinutes);

  return (
    <div className="relative w-full max-w-5xl mx-auto pt-0 pb-8">
      <div ref={topRef} className="absolute top-[-20px] left-0" />

      {/* --- FORM CARD --- */}
      <div className="bg-white p-4 pt-6 md:p-8 md:pt-8 rounded-t-3xl md:rounded-3xl shadow-card border-0 md:border border-marien-800/20 animate-fade-in mt-2">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Left Column: Time & Duties */}
          <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⏰</span>
              <h3 className="text-xl font-bold text-marien-800">Zeit & Dienst</h3>
            </div>
            
            <div className="space-y-5 flex-1">
              <Select 
                label="Welchen Dienst hast du?" 
                value={entry.dienst} 
                onChange={(e) => updateField('dienst', e.target.value)}
                className="bg-white border-blue-200 text-lg font-semibold text-marien-800"
              >
                {Object.values(DienstTyp).map(v => <option key={v} value={v}>{v}</option>)}
              </Select>

              <div className="grid grid-cols-3 gap-3">
                <Input type="time" label="Beginn" value={entry.arbeitsBeginn} onChange={(e) => updateField('arbeitsBeginn', e.target.value)} className="text-center font-mono text-lg" />
                <Select label="Pause" value={entry.pausenDauer} onChange={(e) => updateField('pausenDauer', e.target.value)} className="text-center font-mono text-lg">
                  <option value={PauseDauer.MIN_30}>30 Min</option>
                  <option value={PauseDauer.STD_3}>3 Std</option>
                </Select>
                <Input type="time" label="Ende" value={entry.arbeitsEnde} onChange={(e) => updateField('arbeitsEnde', e.target.value)} className="text-center font-mono text-lg" />
              </div>
              
              <div className="mt-4">
                 {/* SPLIT DISPLAY CONTAINER */}
                 <div className="flex rounded-xl border-2 border-gray-200 bg-white overflow-hidden shadow-sm h-24">
                    
                    {/* LEFT: NORMAL (Green) */}
                    <div className="flex-1 flex flex-col items-center justify-start pt-3 bg-green-50/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-green-600 leading-none mb-1">
                            Normal
                        </span>
                        <span className="text-4xl font-black font-mono text-green-600 mt-auto mb-auto pb-2">
                            {normalString}
                        </span>
                    </div>

                    {/* SEPARATOR LINE */}
                    <div className="w-[2px] h-full bg-red-400"></div>

                    {/* RIGHT: OVERTIME (Red) */}
                    <div className="flex-1 flex flex-col items-center justify-start pt-3 bg-red-50/50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 leading-none mb-1">
                            Überstunden
                        </span>
                        <span className={`text-4xl font-black font-mono mt-auto mb-auto pb-2 ${overtimeMinutes > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                            {overtimeString}
                        </span>
                    </div>
                 </div>
              </div>

               {/* MOVED: Daily Rating (Was in right column) */}
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm mt-5">
                 <Select 
                  label="Wie war dein Tag?" 
                  value={entry.bewertung} 
                  onChange={(e) => updateField('bewertung', e.target.value)}
                  className={`font-bold text-lg border-none bg-transparent !p-0 focus:ring-0 cursor-pointer 
                    ${entry.bewertung === Bewertung.PERFEKT ? "text-green-500" : 
                      entry.bewertung === Bewertung.GUT ? "text-teal-500" :
                      entry.bewertung === Bewertung.NAJA ? "text-yellow-500" :
                      entry.bewertung === Bewertung.SCHLECHT ? "text-orange-500" : "text-red-500"
                    }`}
                >
                  {Object.values(Bewertung).map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
              </div>

            </div>
          </div>

          {/* Right Column: Team & Mood */}
          <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">👥</span>
              <h3 className="text-xl font-bold text-marien-800">Team & Stimmung</h3>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-marien-600 uppercase tracking-wider mb-3 block">Wer war dabei?</label>
                <div className="grid grid-cols-2 gap-3">
                  {COLLEAGUES.map((name, idx) => {
                    const isActive = !!entry.mitarbeiter[idx];
                    const rating = entry.mitarbeiterStimmung ? entry.mitarbeiterStimmung[idx] : 5;

                    return (
                      <div 
                        key={name} 
                        className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-1 cursor-pointer group ${
                          isActive 
                            ? 'bg-white border-marien-500 shadow-md scale-[1.01]' 
                            : 'bg-transparent border-transparent hover:bg-white/40 text-gray-400'
                        }`}
                      >
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             const newMa = [...entry.mitarbeiter];
                             newMa[idx] = !isActive;
                             updateField('mitarbeiter', newMa);
                           }}
                           className={`font-bold text-base w-full text-center z-10 cursor-pointer ${isActive ? 'text-marien-900' : ''}`}
                         >
                           {name}
                         </button>

                         {isActive && (
                           <div className="flex gap-1 mt-1 animate-fade-in z-20 cursor-pointer">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newRatings = [...(entry.mitarbeiterStimmung || [])];
                                    while (newRatings.length < COLLEAGUES.length) newRatings.push(5);
                                    newRatings[idx] = star;
                                    updateField('mitarbeiterStimmung', newRatings);
                                  }}
                                  className="focus:outline-none hover:scale-125 transition-transform cursor-pointer"
                                >
                                  <svg 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    viewBox="0 0 24 24" 
                                    fill="currentColor" 
                                    className={`w-4 h-4 ${
                                      star <= rating 
                                        ? rating <= 2 ? 'text-red-500' : rating === 3 ? 'text-yellow-500' : 'text-green-500' 
                                        : 'text-gray-200'
                                    }`}
                                  >
                                    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              ))}
                           </div>
                         )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Notes & Dashboard */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* --- NOTES MODULE --- */}
          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
             <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">📝</span>
              <h3 className="text-xl font-bold text-marien-800">Vorkommnisse an diesem Tag</h3>
            </div>
            
            {/* Creation Area */}
            <div className="mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <Input 
                   placeholder="Titel (z.B. Übergabe, Sturz)"
                   value={newNoteTitle}
                   onChange={(e) => setNewNoteTitle(e.target.value)}
                   className="mb-2 font-bold !border-gray-200 focus:!border-marien-300"
                />
                <Textarea
                   placeholder="Inhalt..."
                   value={newNoteText}
                   onChange={(e) => setNewNoteText(e.target.value)}
                   className="h-20 min-h-[80px] text-sm mb-2 !bg-gray-50 focus:!bg-white transition-colors"
                />
                <Button onClick={addNote} disabled={!newNoteText && !newNoteTitle} variant="secondary" className="w-full text-sm py-2">
                   + Vorkommnis anlegen
                </Button>
            </div>

            {/* Notes List (Accordion) */}
            <div className="space-y-3">
                {Array.isArray(entry.vorkommnisse) && entry.vorkommnisse.map((note: Notiz) => {
                    const isExpanded = expandedNoteIds.includes(note.id);
                    return (
                        <div key={note.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300">
                            {/* Header */}
                            <div 
                               className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 select-none"
                               onClick={() => toggleNote(note.id)}
                            >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                        ▶
                                    </div>
                                    {/* Inline Edit Title */}
                                    <input 
                                        value={note.titel}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => updateNote(note.id, 'titel', e.target.value)}
                                        className="font-bold text-marien-800 bg-transparent border-none focus:ring-0 p-0 w-full text-sm cursor-text"
                                        placeholder="Ohne Titel"
                                    />
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                    className="text-red-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-full transition-colors"
                                >
                                    🗑️
                                </button>
                            </div>

                            {/* Body */}
                            {isExpanded && (
                                <div className="p-3 pt-0 border-t border-gray-100 bg-gray-50/30">
                                    <textarea
                                        value={note.text}
                                        onChange={(e) => updateNote(note.id, 'text', e.target.value)}
                                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm text-gray-700 h-24 resize-none leading-relaxed"
                                        placeholder="Text..."
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
                {(!entry.vorkommnisse || entry.vorkommnisse.length === 0) && (
                    <div className="text-center text-gray-400 text-sm italic py-4">Keine Vorkommnisse.</div>
                )}
            </div>
          </div>

          {/* --- NEW DASHBOARD SECTION --- */}
          <div className="bg-gradient-to-br from-marien-900 to-marien-800 p-6 md:p-8 rounded-3xl shadow-float text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-marien-600/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
              
              <div className="relative z-10 flex items-center gap-3 mb-6">
                 <div className="text-3xl">📌</div>
                 <h2 className="text-2xl font-black uppercase tracking-tight">Mein Dashboard</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  
                  {/* LEFT: Future Events */}
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-marien-300 font-bold uppercase tracking-widest text-xs mb-4 border-b border-white/10 pb-2">Kommende Termine</h3>
                      
                      <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                          {futureEvents.length === 0 && <p className="text-white/40 italic text-sm">Keine zukünftigen Termine.</p>}
                          {futureEvents.map(ev => (
                              <div key={ev.id} className="bg-black/20 rounded-xl p-3 flex gap-3 hover:bg-black/30 transition-colors group">
                                  <div className="flex flex-col items-center justify-center bg-marien-500 text-white rounded-lg w-10 h-10 shrink-0 shadow-sm leading-none">
                                      <span className="text-[8px] font-bold uppercase">{new Date(ev.datum).toLocaleDateString('de-DE', {weekday:'short'}).substring(0,2)}</span>
                                      <span className="text-sm font-black">{new Date(ev.datum).getDate()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <input 
                                         value={ev.titel}
                                         onChange={(e) => updateEvent(ev.id, 'titel', e.target.value)}
                                         className="bg-transparent border-none text-white font-bold text-sm w-full p-0 focus:ring-0 placeholder-white/30"
                                      />
                                      <div className="flex items-center justify-between mt-1">
                                          <input 
                                             type="date"
                                             value={ev.datum}
                                             onChange={(e) => updateEvent(ev.id, 'datum', e.target.value)}
                                             className="bg-transparent border-none text-[10px] text-marien-200 p-0 focus:ring-0 h-4"
                                          />
                                          <button onClick={() => deleteEvent(ev.id)} className="text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* RIGHT: Global Tasks */}
                  <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <h3 className="text-marien-300 font-bold uppercase tracking-widest text-xs mb-4 border-b border-white/10 pb-2">Meine Aufgaben</h3>
                      
                      {/* Add Task Mini */}
                      <div className="flex gap-2 mb-3">
                          <input 
                             value={newTaskText}
                             onChange={(e) => setNewTaskText(e.target.value)}
                             placeholder="Neue Aufgabe..."
                             className="flex-1 bg-black/20 border-none rounded-lg text-sm text-white placeholder-white/40 px-3 focus:ring-1 focus:ring-marien-400"
                             onKeyDown={(e) => e.key === 'Enter' && addTask()}
                          />
                          <button onClick={addTask} className="bg-marien-500 hover:bg-marien-400 text-white rounded-lg px-3 font-bold">+</button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar pr-2">
                           {globalTasks.length === 0 && <p className="text-white/40 italic text-sm">Alles erledigt!</p>}
                           {globalTasks.map(task => (
                               <div key={task.id} className="flex items-center gap-2 bg-black/20 p-2 rounded-lg group">
                                   <input 
                                      type="checkbox"
                                      checked={task.erledigt}
                                      onChange={() => toggleTask(task.id)}
                                      className="w-4 h-4 rounded accent-marien-500 cursor-pointer"
                                   />
                                   <span className={`flex-1 text-sm truncate ${task.erledigt ? 'line-through text-white/40' : 'text-white'}`}>
                                       {task.text}
                                   </span>
                                   <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                               </div>
                           ))}
                      </div>
                  </div>

              </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DailyEntryForm;
