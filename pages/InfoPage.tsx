
import React, { useEffect, useState, useMemo } from 'react';
import { Notiz, KalenderEintrag, KalenderTyp, Aufgabe } from '../types';
import { getInfoNotes, saveInfoNotes, getCalendarEvents, saveCalendarEvents, getGlobalTasks, saveGlobalTasks } from '../services/storageService';
import { Button, Input, Textarea, Select } from '../components/UI';

const InfoPage: React.FC = () => {
  // --- NOTES STATE ---
  const [notes, setNotes] = useState<Notiz[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [sortMode, setSortMode] = useState<'date' | 'alpha'>('date');
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");

  // --- CALENDAR STATE ---
  const [calendarEvents, setCalendarEvents] = useState<KalenderEintrag[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAllEvents, setShowAllEvents] = useState(false); // Toggle for global list
  const [calendarFilter, setCalendarFilter] = useState<KalenderTyp | 'ALL'>('ALL'); // NEW: Filter
  
  // New Event State
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<KalenderTyp>(KalenderTyp.INTERN);

  // Edit Event State
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventTitle, setEditEventTitle] = useState("");
  const [editEventType, setEditEventType] = useState<KalenderTyp>(KalenderTyp.INTERN);

  // --- GLOBAL TASKS STATE ---
  const [tasks, setTasks] = useState<Aufgabe[]>([]);
  const [newTaskText, setNewTaskText] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const noteData = await getInfoNotes();
    setNotes(noteData);
    const calData = await getCalendarEvents();
    setCalendarEvents(calData);
    const taskData = await getGlobalTasks();
    setTasks(taskData);
  };

  // --- NOTES LOGIC ---

  const saveAndSetNotes = async (newNotes: Notiz[]) => {
      setNotes(newNotes);
      await saveInfoNotes(newNotes);
  };

  const handleAddNote = () => {
      if (!newTitle.trim() && !newText.trim()) return;
      const newNote: Notiz = {
          id: Date.now().toString(),
          titel: newTitle.trim() || "Information",
          text: newText,
          erstelltAm: new Date().toISOString()
      };
      const updated = [newNote, ...notes];
      saveAndSetNotes(updated);
      setNewTitle("");
      setNewText("");
      setExpandedIds(prev => [...prev, newNote.id]);
  };

  const handleDeleteNote = (id: string) => {
      if (window.confirm("Soll diese Information wirklich gelöscht werden?")) {
          saveAndSetNotes(notes.filter(n => n.id !== id));
      }
  };

  const handleUpdateNote = (id: string, field: 'titel' | 'text', val: string) => {
      const updated = notes.map(n => n.id === id ? { ...n, [field]: val } : n);
      saveAndSetNotes(updated);
  };

  const toggleExpand = (id: string) => {
      setExpandedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
  };

  // --- CALENDAR LOGIC ---

  const saveAndSetCalendar = async (newEvents: KalenderEintrag[]) => {
      setCalendarEvents(newEvents);
      await saveCalendarEvents(newEvents);
  };

  const handleAddEvent = () => {
      if (!selectedDate || !newEventTitle.trim()) return;
      
      const newEvent: KalenderEintrag = {
          id: Date.now().toString() + Math.random(),
          titel: newEventTitle,
          datum: selectedDate,
          typ: newEventType
      };
      
      saveAndSetCalendar([...calendarEvents, newEvent]);
      setNewEventTitle("");
  };

  const handleDeleteEvent = (id: string) => {
       if (window.confirm("Eintrag wirklich löschen?")) {
           saveAndSetCalendar(calendarEvents.filter(e => e.id !== id));
       }
  };

  const startEditingEvent = (ev: KalenderEintrag) => {
      setEditingEventId(ev.id);
      setEditEventTitle(ev.titel);
      setEditEventType(ev.typ);
  };

  const cancelEditingEvent = () => {
      setEditingEventId(null);
      setEditEventTitle("");
  };

  const saveEditedEvent = () => {
      if (!editingEventId || !editEventTitle.trim()) return;

      const updatedList = calendarEvents.map(ev => 
          ev.id === editingEventId 
            ? { ...ev, titel: editEventTitle, typ: editEventType }
            : ev
      );
      
      saveAndSetCalendar(updatedList);
      setEditingEventId(null);
  };

  const changeMonth = (offset: number) => {
      const d = new Date(currentMonth);
      d.setMonth(d.getMonth() + offset);
      setCurrentMonth(d);
      setSelectedDate(null);
  };

  const changeYear = (offset: number) => {
      const d = new Date(currentMonth);
      d.setFullYear(d.getFullYear() + offset);
      setCurrentMonth(d);
      setSelectedDate(null);
  };

  const jumpToToday = () => {
      setCurrentMonth(new Date());
      setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  const getEventColor = (type: KalenderTyp) => {
      switch (type) {
          case KalenderTyp.GEBURTSTAG: return "bg-fun-pink text-white shadow-pink-200";
          case KalenderTyp.URLAUB: return "bg-fun-blue text-white shadow-blue-200";
          case KalenderTyp.SCHULUNG: return "bg-fun-orange text-white shadow-orange-200";
          case KalenderTyp.INTERN: return "bg-marien-500 text-white shadow-marien-200";
          default: return "bg-gray-400 text-white shadow-gray-200";
      }
  };

  const getEventSymbol = (type: KalenderTyp) => {
      switch (type) {
          case KalenderTyp.GEBURTSTAG: return "🎂";
          case KalenderTyp.URLAUB: return "🏖️";
          case KalenderTyp.SCHULUNG: return "🎓";
          case KalenderTyp.INTERN: return "👥";
          default: return "📌";
      }
  };

  // --- GLOBAL TASKS LOGIC ---
  const saveAndSetTasks = async (newTasks: Aufgabe[]) => {
      setTasks(newTasks);
      await saveGlobalTasks(newTasks);
  };

  const handleAddTask = () => {
      if (!newTaskText.trim()) return;
      const newTask: Aufgabe = {
          id: Date.now().toString(),
          text: newTaskText,
          erledigt: false
      };
      saveAndSetTasks([...tasks, newTask]);
      setNewTaskText("");
  };

  const handleToggleTask = (taskId: string) => {
      const updated = tasks.map(t => t.id === taskId ? { ...t, erledigt: !t.erledigt } : t);
      saveAndSetTasks(updated);
  };

  const handleDeleteTask = (taskId: string) => {
      saveAndSetTasks(tasks.filter(t => t.id !== taskId));
  };


  const sortedNotes = [...notes].sort((a, b) => {
      if (sortMode === 'date') return new Date(b.erstelltAm).getTime() - new Date(a.erstelltAm).getTime();
      return a.titel.localeCompare(b.titel, 'de', { sensitivity: 'base' });
  });
  
  // Filtered Events
  const filteredEvents = useMemo(() => {
      return calendarFilter === 'ALL' 
        ? calendarEvents 
        : calendarEvents.filter(e => e.typ === calendarFilter);
  }, [calendarEvents, calendarFilter]);

  // Sort events for the global list
  const allSortedEvents = useMemo(() => {
      return [...filteredEvents].sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
  }, [filteredEvents]);

  // Group events by month for the agenda view
  const eventsByMonth = useMemo(() => {
      const groups: Record<string, KalenderEintrag[]> = {};
      allSortedEvents.forEach(ev => {
          const key = new Date(ev.datum).toLocaleString('de-DE', { month: 'long', year: 'numeric' });
          if (!groups[key]) groups[key] = [];
          groups[key].push(ev);
      });
      return groups;
  }, [allSortedEvents]);

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); 
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
  
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: startOffset }, (_, i) => i);

  return (
    <>
    {/* SCREEN VIEW - HIDDEN ON PRINT */}
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-32 print:hidden">

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-28 xl:gap-24 items-start">
        
        {/* LEFT COLUMN: KNOWLEDGE BASE */}
        <div className="flex flex-col gap-12">
             {/* 3. KNOWLEDGE BASE MODULE */}
             <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-card border border-indigo-100/50 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400"></div>

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm">
                            <span className="text-3xl">📚</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-marien-900 uppercase tracking-tight">Wissen</h1>
                            <p className="text-indigo-500 text-xs font-bold uppercase tracking-widest">Datenbank</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button onClick={() => setSortMode('date')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sortMode === 'date' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Datum</button>
                            <button onClick={() => setSortMode('alpha')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${sortMode === 'alpha' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>A-Z</button>
                        </div>
                        <Button variant="ghost" onClick={() => window.print()} className="!p-2 !rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer" title="Drucken">🖨️</Button>
                    </div>
                </div>

                {/* New Note Input */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                    <Input 
                        placeholder="Titel (z.B. Hygienestandards)" 
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="mb-2 !bg-white cursor-text font-bold"
                    />
                    <Textarea 
                        placeholder="Inhalt der Anweisung..." 
                        value={newText}
                        onChange={(e) => setNewText(e.target.value)}
                        className="mb-3 h-24 !bg-white cursor-text"
                    />
                    <Button onClick={handleAddNote} disabled={!newTitle && !newText} className="w-full !rounded-xl cursor-pointer">
                        + Eintrag speichern
                    </Button>
                </div>

                {/* Notes List */}
                <div className="flex flex-col gap-4">
                    {sortedNotes.length === 0 && <p className="text-gray-400 text-center py-4">Keine Einträge vorhanden.</p>}
                    
                    {sortedNotes.map(note => {
                        const isExpanded = expandedIds.includes(note.id);
                        return (
                            <div key={note.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                                <div 
                                    className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-white to-gray-50 hover:to-gray-100"
                                    onClick={() => toggleExpand(note.id)}
                                >
                                    <div className="flex-1">
                                        <input 
                                            value={note.titel}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => handleUpdateNote(note.id, 'titel', e.target.value)}
                                            className="font-bold text-marien-900 bg-transparent border-none p-0 focus:ring-0 w-full text-lg cursor-text"
                                        />
                                        <div className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                                            {new Date(note.erstelltAm).toLocaleDateString('de-DE')}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                         {/* Explicit Collapse/Expand Button */}
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); toggleExpand(note.id); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
                                            title={isExpanded ? "Einklappen" : "Ausklappen"}
                                         >
                                            <svg 
                                                xmlns="http://www.w3.org/2000/svg" 
                                                fill="none" 
                                                viewBox="0 0 24 24" 
                                                strokeWidth={2.5} 
                                                stroke="currentColor" 
                                                className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                            </svg>
                                         </button>

                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteNote(note.id); }}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-300 hover:bg-red-100 hover:text-red-500 transition-colors cursor-pointer"
                                            title="Löschen"
                                         >
                                            🗑️
                                         </button>
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <div className="p-4 pt-0 border-t border-gray-100 bg-white">
                                        <textarea 
                                            value={note.text}
                                            onChange={(e) => handleUpdateNote(note.id, 'text', e.target.value)}
                                            className="w-full h-48 bg-transparent border-none resize-y focus:ring-0 text-gray-600 leading-relaxed cursor-text mt-4"
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: TASKS & CALENDAR */}
        <div className="flex flex-col gap-12">
            
            {/* 1. GLOBAL TASKS MODULE (Moved here) */}
            <div className="bg-purple-50 p-6 md:p-8 rounded-[2.5rem] shadow-card border border-purple-100 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-400 to-purple-600"></div>

                {/* Header */}
                <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white text-purple-600 flex items-center justify-center shadow-sm">
                        <span className="text-3xl">✅</span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-marien-900 uppercase tracking-tight">Aufgaben</h1>
                        <p className="text-purple-500 text-xs font-bold uppercase tracking-widest">Allgemeine To-Dos</p>
                    </div>
                </div>

                {/* Input Area */}
                <div className="flex gap-2">
                    <Input 
                        placeholder="Neue Aufgabe..." 
                        value={newTaskText} 
                        onChange={(e) => setNewTaskText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                        className="!bg-white shadow-sm cursor-text border-purple-100 focus:!border-purple-300"
                    />
                    <Button onClick={handleAddTask} disabled={!newTaskText} className="!rounded-xl px-4 bg-purple-600 hover:bg-purple-700 shadow-purple-200 cursor-pointer text-white">
                        +
                    </Button>
                </div>
                
                {/* Task List */}
                <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {tasks.length === 0 && <p className="text-gray-400 italic text-center mt-4 text-sm">Alles erledigt? Super!</p>}
                    <ul className="space-y-2">
                        {tasks.map(task => (
                            <li key={task.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-purple-100 group hover:border-purple-300 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <input 
                                        type="checkbox" 
                                        checked={task.erledigt} 
                                        onChange={() => handleToggleTask(task.id)}
                                        className="w-5 h-5 accent-purple-500 cursor-pointer rounded"
                                    />
                                    <span className={`truncate ${task.erledigt ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}`}>
                                        {task.text}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => handleDeleteTask(task.id)}
                                    className="text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 p-1 rounded transition-all font-bold cursor-pointer"
                                >
                                    ✕
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* 2. CALENDAR MODULE */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-card border border-marien-100/50 flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-marien-400 via-fun-pink to-fun-blue"></div>

                {/* Header */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-marien-50 text-marien-600 flex items-center justify-center shadow-sm">
                            <span className="text-3xl">📅</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-marien-900 uppercase tracking-tight">Kalender</h1>
                            <p className="text-marien-500 text-xs font-bold uppercase tracking-widest">Terminübersicht</p>
                        </div>
                        
                        <div className="ml-auto">
                           <Button variant="ghost" onClick={jumpToToday} className="!text-xs !py-1 !px-3 bg-marien-50 text-marien-600 !rounded-lg border border-marien-100">
                               Heute
                           </Button>
                        </div>
                    </div>
                    
                    {/* Navigation Bar */}
                    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
                        <div className="flex gap-1">
                            <button onClick={() => changeYear(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 text-xs font-bold transition-all">«</button>
                            <button onClick={() => changeMonth(-1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-gray-600 hover:text-marien-600 font-bold transition-all">◀</button>
                        </div>
                        
                        <div className="text-center">
                            <span className="font-black text-marien-900 text-lg block leading-none">
                                {currentMonth.toLocaleString('de-DE', { month: 'long' })}
                            </span>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                {currentMonth.getFullYear()}
                            </span>
                        </div>

                        <div className="flex gap-1">
                            <button onClick={() => changeMonth(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-gray-600 hover:text-marien-600 font-bold transition-all">▶</button>
                            <button onClick={() => changeYear(1)} className="w-8 h-8 flex items-center justify-center hover:bg-white rounded-lg text-gray-400 hover:text-gray-600 text-xs font-bold transition-all">»</button>
                        </div>
                    </div>
                    
                    {/* Filter Dropdown */}
                    <Select 
                        value={calendarFilter} 
                        onChange={(e) => setCalendarFilter(e.target.value as any)}
                        className="!py-2 !text-sm !bg-white"
                    >
                        <option value="ALL">Alle Termine anzeigen</option>
                        {Object.values(KalenderTyp).map(t => <option key={t} value={t}>Nur {t}</option>)}
                    </Select>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 text-center mb-2">
                    {['Mo','Di','Mi','Do','Fr','Sa','So'].map(d => (
                        <div key={d} className="text-[10px] uppercase font-bold text-gray-400 tracking-wider py-2">{d}</div>
                    ))}
                    
                    {emptySlots.map(i => <div key={`empty-${i}`} />)}
                    
                    {daysArray.map(day => {
                        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const isSelected = selectedDate === dateStr;
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        
                        const dayEvents = filteredEvents.filter(e => e.datum === dateStr);

                        return (
                            <div 
                                key={day} 
                                onClick={() => setSelectedDate(dateStr)}
                                className={`
                                    relative h-16 md:h-20 rounded-2xl flex flex-col items-center justify-start pt-2 cursor-pointer transition-all border border-transparent
                                    ${isSelected ? 'bg-marien-600 text-white shadow-lg scale-105 z-10' : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:border-gray-200'}
                                    ${isToday && !isSelected ? 'ring-2 ring-fun-yellow ring-offset-2' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-900'}`}>{day}</span>
                                
                                {/* Event Indicators */}
                                <div className="flex flex-col gap-0.5 mt-1 w-full px-1 overflow-hidden">
                                     {dayEvents.slice(0, 2).map(ev => (
                                         <div key={ev.id} className={`text-[9px] truncate w-full px-1 rounded-sm shadow-sm ${isSelected ? 'bg-white/20' : getEventColor(ev.typ).replace('text-white', 'text-white/90 opacity-90')}`}>
                                             {getEventSymbol(ev.typ)} {ev.titel}
                                         </div>
                                     ))}
                                     {dayEvents.length > 2 && (
                                         <div className="text-[8px] leading-none opacity-50">+ {dayEvents.length - 2}</div>
                                     )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* All Events List (Collapsible Agenda View) */}
                <button 
                    onClick={() => setShowAllEvents(!showAllEvents)}
                    className="flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-500 transition-colors w-full cursor-pointer"
                >
                    <span>{showAllEvents ? "▲" : "▼"}</span>
                    Alle Termine {showAllEvents ? "einklappen" : "anzeigen"}
                </button>

                {showAllEvents && (
                    <div className="bg-gray-50 rounded-2xl p-4 max-h-[500px] overflow-y-auto custom-scrollbar border border-gray-100 shadow-inner">
                        {Object.keys(eventsByMonth).length === 0 && <p className="text-center text-gray-400 text-sm">Keine Termine gefunden.</p>}
                        
                        {Object.entries(eventsByMonth).map(([month, evs]: [string, KalenderEintrag[]]) => (
                            <div key={month} className="mb-6 last:mb-0">
                                <h4 className="text-xs font-bold uppercase text-marien-500 tracking-widest mb-3 sticky top-0 bg-gray-50 py-2 border-b border-gray-200">{month}</h4>
                                <div className="space-y-3">
                                    {evs.map(ev => (
                                        <div 
                                            key={ev.id} 
                                            className="bg-white p-3 rounded-xl border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
                                            onClick={() => { setCurrentMonth(new Date(ev.datum)); setSelectedDate(ev.datum); }}
                                        >
                                            <div className="flex flex-col items-center justify-center bg-green-50 text-green-700 rounded-lg w-12 h-12 shrink-0 border border-green-100 group-hover:bg-green-100 transition-colors">
                                                <span className="text-[9px] font-bold uppercase">{new Date(ev.datum).toLocaleDateString('de-DE', {weekday:'short'}).substring(0,2)}</span>
                                                <span className="text-lg font-black leading-none">{new Date(ev.datum).getDate()}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-800 truncate">{ev.titel}</div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getEventColor(ev.typ).split(' ')[0]} bg-opacity-20 text-gray-600`}>
                                                        {getEventSymbol(ev.typ)} {ev.typ}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Selected Date View (Below Grid) */}
                {selectedDate && (
                    <div className="animate-fade-in border-t border-gray-100 pt-6">
                        <h3 className="text-center font-bold text-marien-900 mb-4 bg-marien-50 py-2 rounded-xl">
                            {new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </h3>
                        
                        {/* Add Form */}
                        <div className="flex flex-col gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                             <Input 
                                placeholder="Termin Titel..." 
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="!bg-white cursor-text font-bold"
                             />
                             <div className="flex gap-2">
                                 <Select 
                                    value={newEventType} 
                                    onChange={(e) => setNewEventType(e.target.value as KalenderTyp)}
                                    className="!bg-white cursor-pointer"
                                 >
                                     {Object.values(KalenderTyp).map(t => <option key={t} value={t}>{t}</option>)}
                                 </Select>
                                 <Button onClick={handleAddEvent} disabled={!newEventTitle} className="!rounded-xl px-6 cursor-pointer">
                                     Hinzufügen
                                 </Button>
                             </div>
                        </div>

                        {/* Events List for Day */}
                        <div className="space-y-3">
                            {filteredEvents.filter(e => e.datum === selectedDate).map(ev => (
                                <div key={ev.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group">
                                    {editingEventId === ev.id ? (
                                        <div className="flex-1 flex flex-col gap-2">
                                            <Input 
                                                value={editEventTitle}
                                                onChange={(e) => setEditEventTitle(e.target.value)}
                                                className="!py-1 !px-2 !text-sm cursor-text"
                                                autoFocus
                                            />
                                            <div className="flex gap-2">
                                                <Select 
                                                    value={editEventType}
                                                    onChange={(e) => setEditEventType(e.target.value as KalenderTyp)}
                                                    className="!py-1 !px-2 !text-xs cursor-pointer"
                                                >
                                                    {Object.values(KalenderTyp).map(t => <option key={t} value={t}>{t}</option>)}
                                                </Select>
                                                <button onClick={saveEditedEvent} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded cursor-pointer">Speichern</button>
                                                <button onClick={cancelEditingEvent} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded cursor-pointer">Abbr.</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm ${getEventColor(ev.typ)}`}>
                                                    {getEventSymbol(ev.typ)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-800">{ev.titel}</div>
                                                    <div className="text-[10px] uppercase font-bold text-gray-400">{ev.typ}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => startEditingEvent(ev)}
                                                    className="w-8 h-8 rounded-full hover:bg-blue-50 text-blue-300 hover:text-blue-500 flex items-center justify-center transition-colors cursor-pointer"
                                                >
                                                    ✏️
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteEvent(ev.id)}
                                                    className="w-8 h-8 rounded-full hover:bg-red-50 text-red-300 hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                            {filteredEvents.filter(e => e.datum === selectedDate).length === 0 && (
                                <p className="text-center text-gray-400 text-sm italic">Keine Termine für diese Auswahl.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>

    {/* PRINT VIEW - ONLY VISIBLE WHEN PRINTING */}
    <div className="print-portrait-wrapper print-only bg-white w-full max-w-[210mm] min-h-[297mm] p-[20mm]">
        <header className="border-b-2 border-marien-900 pb-4 mb-8 flex justify-between items-end">
             <div>
                <div className="flex items-center gap-2 mb-2 text-marien-600">
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="print-text-black">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        <path d="M12 11V7" />
                        <path d="M12 11L10 13" />
                   </svg>
                   <span className="font-bold uppercase tracking-widest text-xs print-text-black">Tina AI Marienhof</span>
                </div>
                <h1 className="text-3xl font-black uppercase text-black">Wissensdatenbank</h1>
            </div>
            <div className="text-right">
                <div className="text-sm text-gray-500 uppercase font-bold tracking-wider print-text-black">Stand</div>
                <div className="text-xl font-bold text-black">
                    {new Date().toLocaleDateString('de-DE')}
                </div>
            </div>
        </header>

        <div className="space-y-6">
            {sortedNotes.map(note => (
                <div key={note.id} className="border-b border-gray-200 pb-4 break-inside-avoid print-border-black">
                    <div className="flex justify-between items-baseline mb-2">
                        <h3 className="text-lg font-bold text-black">{note.titel}</h3>
                        <span className="text-xs text-gray-500 print-text-black">{new Date(note.erstelltAm).toLocaleDateString('de-DE')}</span>
                    </div>
                    <p className="text-sm text-black whitespace-pre-wrap leading-relaxed text-justify">
                        {note.text}
                    </p>
                </div>
            ))}
        </div>
        
        <footer className="mt-12 pt-4 border-t border-gray-300 text-center text-xs text-gray-500 print-text-black">
            Internes Dokument • Vertraulich behandeln • Seite 1
        </footer>
    </div>
    </>
  );
};

export default InfoPage;
