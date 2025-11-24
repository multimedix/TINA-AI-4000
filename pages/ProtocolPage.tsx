
import React, { useEffect, useState, useMemo } from 'react';
import { ArbeitsEintrag, Notiz, KalenderEintrag, KalenderTyp, DienstTyp, Bewertung } from '../types';
import { getEntryByDate, createDefaultEntry, getCalendarEvents, getEntries } from '../services/storageService';
import { DateNavigation } from '../components/DateNavigation';
import { Button } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, AreaChart, Area } from 'recharts';

interface Props {
  selectedDate: string;
  onDateSelect: (date: string) => void;
}

const COLLEAGUES = ["Tina", "Gaby", "Rezija", "Klaas", "Conny", "Sandra", "Teamleitung", "Chefin"];

const ProtocolPage: React.FC<Props> = ({ selectedDate, onDateSelect }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Daily State
  const [entry, setEntry] = useState<ArbeitsEintrag | null>(null);
  const [dayEvents, setDayEvents] = useState<KalenderEintrag[]>([]);
  
  // Weekly Data State
  const [weekEntries, setWeekEntries] = useState<ArbeitsEintrag[]>([]);
  const [weekEvents, setWeekEvents] = useState<KalenderEintrag[]>([]);
  const [weekRange, setWeekRange] = useState({ start: new Date(), end: new Date() });

  // Monthly Data State
  const [monthEntries, setMonthEntries] = useState<ArbeitsEintrag[]>([]);
  const [monthEvents, setMonthEvents] = useState<KalenderEintrag[]>([]);
  
  const loadEntry = async (date: string) => {
    // 1. Load Work Entry
    let e = await getEntryByDate(date);
    if (e) {
        const rawVorkommnisse = e.vorkommnisse as unknown;
        if (typeof rawVorkommnisse === 'string') {
             if (rawVorkommnisse.length > 0) {
                 e.vorkommnisse = [{ id: 'mig', titel: 'Notiz', text: rawVorkommnisse, erstelltAm: '' }];
             } else {
                 e.vorkommnisse = [];
             }
        }
    }
    setEntry(e || createDefaultEntry(date));

    // 2. Load Calendar Events for this day
    const allEvents = await getCalendarEvents();
    const eventsForDay = allEvents.filter(ev => ev.datum === date);
    setDayEvents(eventsForDay);

    // 3. Load All Entries for Stats
    const allEntries = await getEntries();
    allEntries.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
    
    // --- MONTHLY DATA ---
    const dateObj = new Date(date);
    const currentMonthStr = date.substring(0, 7); // YYYY-MM
    
    const mEntries = allEntries.filter(en => en.datum.startsWith(currentMonthStr));
    setMonthEntries(mEntries);

    const mEvents = allEvents.filter(ev => ev.datum.startsWith(currentMonthStr));
    setMonthEvents(mEvents);

    // --- WEEKLY DATA ---
    // Calculate Monday and Sunday of the selected date's week
    const currentDay = dateObj.getDay(); // 0 = Sunday
    const diffToMonday = dateObj.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    
    const monday = new Date(dateObj);
    monday.setDate(diffToMonday);
    monday.setHours(0,0,0,0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23,59,59,999);

    setWeekRange({ start: monday, end: sunday });

    const wEntries = allEntries.filter(en => {
        const d = new Date(en.datum);
        return d >= monday && d <= sunday;
    });
    setWeekEntries(wEntries);

    const wEvents = allEvents.filter(ev => {
        const d = new Date(ev.datum);
        return d >= monday && d <= sunday;
    });
    setWeekEvents(wEvents);
  };

  useEffect(() => {
    loadEntry(selectedDate);
  }, [selectedDate]);

  // --- STATS CALCULATION HELPER ---
  const calculateStats = (entries: ArbeitsEintrag[], events: KalenderEintrag[]) => {
      let totalHours = 0;
      let totalMins = 0;
      let overtimeMins = 0;
      let sickDays = 0;
      let vacationDays = 0;
      let workDays = 0;
      let moodScore = 0;

      entries.forEach(e => {
          // Work Time
          const [h, m] = e.arbeitsZeitNetto.split(':').map(Number);
          const dailyMins = (h * 60) + m;
          
          if (dailyMins > 0) {
              totalHours += h;
              totalMins += m;
              workDays++;
              if (dailyMins > 480) overtimeMins += (dailyMins - 480);
          }

          if (e.dienst === DienstTyp.KRANK) sickDays++;
          
          // Mood
          if (e.bewertung === Bewertung.PERFEKT) moodScore += 5;
          if (e.bewertung === Bewertung.GUT) moodScore += 4;
          if (e.bewertung === Bewertung.NAJA) moodScore += 3;
          if (e.bewertung === Bewertung.SCHLECHT) moodScore += 2;
          if (e.bewertung === Bewertung.KATASTROPHE) moodScore += 1;
      });

      vacationDays = events.filter(ev => ev.typ === KalenderTyp.URLAUB).length;

      totalHours += Math.floor(totalMins / 60);
      totalMins = totalMins % 60;

      const otHours = Math.floor(overtimeMins / 60);
      const otMinsRemainder = overtimeMins % 60;
      
      const avgMood = entries.length ? (moodScore / entries.length).toFixed(1) : "0";

      return {
          totalTime: `${totalHours}:${totalMins.toString().padStart(2, '0')}`,
          overtime: `${otHours}:${otMinsRemainder.toString().padStart(2, '0')}`,
          sickDays,
          vacationDays,
          workDays,
          eventCount: events.length,
          avgMood
      };
  };

  const monthStats = useMemo(() => calculateStats(monthEntries, monthEvents), [monthEntries, monthEvents]);
  const weekStats = useMemo(() => calculateStats(weekEntries, weekEvents), [weekEntries, weekEvents]);

  // --- CHART DATA GENERATOR ---
  const moodMap: Record<string, number> = {
    [Bewertung.PERFEKT]: 5,
    [Bewertung.GUT]: 4,
    [Bewertung.NAJA]: 3,
    [Bewertung.SCHLECHT]: 2,
    [Bewertung.KATASTROPHE]: 1
  };

  const getChartData = (entries: ArbeitsEintrag[], labelFormat: 'day' | 'date') => {
      return entries.map(e => {
          const [h, m] = e.arbeitsZeitNetto.split(':').map(Number);
          let label = "";
          if (labelFormat === 'day') {
              label = new Date(e.datum).toLocaleDateString('de-DE', { weekday: 'short' });
          } else {
              label = e.datum.split('-')[2];
          }
          return {
              name: label,
              date: e.datum,
              hours: h + (m/60),
              mood: e.bewertung,
              moodScore: moodMap[e.bewertung] || 0
          };
      });
  };

  const monthChartData = getChartData(monthEntries, 'date');
  
  // Fill week chart data to ensure all 7 days are shown even if empty
  const weekChartData = useMemo(() => {
      const days = [];
      const current = new Date(weekRange.start);
      for (let i = 0; i < 7; i++) {
          const dateStr = current.toISOString().split('T')[0];
          const entry = weekEntries.find(e => e.datum === dateStr);
          const weekday = current.toLocaleDateString('de-DE', { weekday: 'short' });
          
          if (entry) {
              const [h, m] = entry.arbeitsZeitNetto.split(':').map(Number);
              days.push({
                  name: weekday,
                  date: dateStr,
                  hours: h + (m/60),
                  moodScore: moodMap[entry.bewertung] || 0
              });
          } else {
              days.push({
                  name: weekday,
                  date: dateStr,
                  hours: 0,
                  moodScore: 0
              });
          }
          current.setDate(current.getDate() + 1);
      }
      return days;
  }, [weekEntries, weekRange]);


  // --- DAILY OVERTIME CALCULATION ---
  const dailyOvertimeStr = useMemo(() => {
      if (!entry) return "00:00";
      const [h, m] = entry.arbeitsZeitNetto.split(':').map(Number);
      const totalMins = (h * 60) + m;
      if (totalMins > 480) {
          const otMins = totalMins - 480;
          const otH = Math.floor(otMins / 60);
          const otM = otMins % 60;
          return `${otH.toString().padStart(2, '0')}:${otM.toString().padStart(2, '0')}`;
      }
      return null;
  }, [entry]);


  // --- EXPORT HANDLERS ---
  const handlePrint = () => {
      setTimeout(() => { window.print(); }, 500);
  };

  const handleEmail = () => {
      if (!entry) return;
      const subject = encodeURIComponent(`Tagesprotokoll Marienhof: ${new Date(entry.datum).toLocaleDateString('de-DE')}`);
      const body = encodeURIComponent(`... (siehe PDF) ...`);
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleExportCsv = (entriesToExport: ArbeitsEintrag[], filename: string) => {
    const getNotesString = (e: ArbeitsEintrag) => {
      if (Array.isArray(e.vorkommnisse)) {
          return e.vorkommnisse.map((n: Notiz) => `[${n.titel}] ${n.text}`).join(" | ");
      }
      return String(e.vorkommnisse || "");
    };

    const headers = ["Datum", "Dienst", "Beginn", "Ende", "Pause", "Netto", ...COLLEAGUES, "Bewertung", "Notizen"];
    const rows = entriesToExport.map(e => [
      e.datum,
      e.dienst,
      e.arbeitsBeginn,
      e.arbeitsEnde,
      e.pausenDauer,
      e.arbeitsZeitNetto,
      ...COLLEAGUES.map((_, i) => {
          if (e.mitarbeiter[i]) return e.mitarbeiterStimmung ? e.mitarbeiterStimmung[i] : "5";
          return "";
      }),
      e.bewertung,
      `"${getNotesString(e).replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- HELPERS ---
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateSelect(d.toISOString().split('T')[0]);
  };
  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateSelect(d.toISOString().split('T')[0]);
  };
  const handleToday = () => {
    onDateSelect(new Date().toISOString().split('T')[0]);
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

  if (!entry) return <div className="text-marien-900 text-center mt-20">Lade Protokoll...</div>;

  return (
    <div className="flex flex-col items-center w-full bg-gray-100 min-h-screen pt-4 md:pt-8 pb-32">
      
      {/* TABS HEADER (Screen Only) */}
      <div className="no-print w-full max-w-[210mm] mb-6 flex bg-white rounded-2xl p-1 shadow-sm border border-gray-200">
          <button 
             onClick={() => setActiveTab('daily')}
             className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'daily' ? 'bg-marien-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
             Tagesprotokoll
          </button>
          <button 
             onClick={() => setActiveTab('weekly')}
             className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'weekly' ? 'bg-marien-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
             Wochenstatistik
          </button>
          <button 
             onClick={() => setActiveTab('monthly')}
             className={`flex-1 py-3 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'monthly' ? 'bg-marien-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
          >
             Monatsstatistik
          </button>
      </div>

      {/* ================================================================================== */}
      {/* VIEW 1: DAILY PROTOCOL (THE PRINT VIEW) */}
      {/* ================================================================================== */}
      <div className={`${activeTab === 'daily' ? 'block' : 'hidden'} print:block w-full flex flex-col items-center`}>
        
        <div className="print-portrait-wrapper bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-[15mm] md:p-[20mm] relative text-slate-800 text-sm leading-normal animate-fade-in mb-8 print:mb-0">
            {/* ... EXISTING PROTOCOL CONTENT ... */}
            <header className="border-b-2 border-marien-900 pb-4 mb-8 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-marien-600">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                            <path d="M12 11V7" />
                            <path d="M12 11L10 13" />
                    </svg>
                    <span className="font-bold uppercase tracking-widest text-xs">Tina AI Marienhof</span>
                    </div>
                    <h1 className="text-3xl font-black uppercase text-slate-900">Tagesprotokoll</h1>
                </div>
                <div className="text-right">
                    <div className="text-sm text-slate-500 uppercase font-bold tracking-wider">Datum</div>
                    <div className="text-2xl font-bold text-slate-900">
                        {new Date(entry.datum).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </div>
                </div>
            </header>

            <section className="grid grid-cols-5 gap-4 mb-8 border-b border-slate-200 pb-8">
                <div className="col-span-1">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Dienst</span>
                    <span className="block text-lg font-bold bg-marien-50 text-marien-900 px-3 py-1 rounded border border-marien-100 inline-block">
                        {entry.dienst}
                    </span>
                </div>
                <div className="col-span-1 text-center border-l border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Beginn</span>
                    <span className="text-xl font-mono font-medium">{entry.arbeitsBeginn}</span>
                </div>
                <div className="col-span-1 text-center border-l border-slate-100">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Ende</span>
                    <span className="text-xl font-mono font-medium">{entry.arbeitsEnde}</span>
                </div>
                <div className="col-span-1 text-right border-l border-slate-100 pl-4">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Nettozeit</span>
                    <span className="text-2xl font-mono font-black text-marien-700">
                        {entry.arbeitsZeitNetto}<span className="text-sm text-slate-400 ml-1 font-bold">h</span>
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Pause: {entry.pausenDauer} min</div>
                </div>
                <div className="col-span-1 text-right border-l border-slate-100 pl-4 flex flex-col justify-center">
                    <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Überstunden</span>
                    {dailyOvertimeStr ? (
                        <span className="text-xl font-mono font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 inline-block">+{dailyOvertimeStr}</span>
                    ) : (
                        <span className="text-xl font-mono font-bold text-slate-300">00:00</span>
                    )}
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-6">
                    {dayEvents.length > 0 && (
                        <section>
                            <h3 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><span>🗓️</span> Termine & Ereignisse</h3>
                            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                {dayEvents.map((ev, idx) => (
                                    <div key={ev.id} className={`p-3 flex items-center gap-3 ${idx !== dayEvents.length -1 ? 'border-b border-slate-100' : ''}`}>
                                        <span className="text-lg">{getEventSymbol(ev.typ)}</span>
                                        <div className="flex-1"><div className="font-bold text-slate-800 text-sm">{ev.titel}</div><div className="text-[10px] uppercase font-bold text-slate-400">{ev.typ}</div></div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    <section className="bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                         <div className="flex justify-between items-center mb-3">
                             <h3 className="font-bold text-xs uppercase text-slate-400 tracking-widest flex items-center gap-2"><span>📊</span> Tagesbewertung</h3>
                             <span className={`font-black uppercase text-base px-2 py-0.5 rounded ${entry.bewertung === 'Perfekt' || entry.bewertung === 'Gut' ? 'bg-green-100 text-green-700' : entry.bewertung === 'Naja' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{entry.bewertung}</span>
                         </div>
                    </section>
                    <section>
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><span>👥</span> Team & Stimmung</h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left p-2 pl-3 font-bold text-slate-500 text-[10px] uppercase">Mitarbeiter</th><th className="text-right p-2 pr-3 font-bold text-slate-500 text-[10px] uppercase">Bewertung</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    {COLLEAGUES.map((name, idx) => {
                                        if (!entry.mitarbeiter[idx]) return null;
                                        const rating = entry.mitarbeiterStimmung ? entry.mitarbeiterStimmung[idx] : 5;
                                        return <tr key={idx}><td className="p-2 pl-3 font-bold text-slate-700">{name}</td><td className="p-2 pr-3 text-right"><div className="flex justify-end gap-0.5">{[1,2,3,4,5].map(star => <span key={star} className={star <= rating ? 'text-slate-800' : 'text-slate-200'}>★</span>)}</div></td></tr>;
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <section>
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><span>☑️</span> Aufgaben</h3>
                        {entry.aufgaben.length > 0 ? (
                            <ul className="space-y-1">{entry.aufgaben.map(t => <li key={t.id} className="flex items-start gap-2 text-sm"><span className={`mt-0.5 ${t.erledigt ? 'text-marien-600' : 'text-slate-300'}`}>{t.erledigt ? '■' : '□'}</span><span className={t.erledigt ? 'text-slate-500' : 'text-slate-900 font-medium'}>{t.text}</span></li>)}</ul>
                        ) : (<div className="text-slate-400 italic text-xs">Keine Aufgaben dokumentiert.</div>)}
                    </section>
                </div>
                <div className="flex flex-col gap-8">
                    <section className="flex-1">
                        <h3 className="font-bold text-xs uppercase text-slate-400 tracking-widest mb-3 flex items-center gap-2"><span>📝</span> Notizen & Vorkommnisse</h3>
                        <div className="flex flex-col gap-4">
                            {Array.isArray(entry.vorkommnisse) && entry.vorkommnisse.length > 0 ? (
                                entry.vorkommnisse.map((n, i) => (<div key={n.id} className="relative pl-4 border-l-2 border-marien-200"><div className="font-bold text-slate-900 mb-1">{n.titel}</div><div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">{n.text}</div></div>))
                            ) : (<div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center"><span className="text-slate-400 text-sm italic">Keine besonderen Vorkommnisse.</span></div>)}
                        </div>
                    </section>
                </div>
            </div>
            <footer className="mt-auto pt-12"><div className="grid grid-cols-2 gap-12"><div><div className="h-px bg-slate-300 mb-2"></div><div className="text-[10px] uppercase font-bold text-slate-400">Unterschrift Arbeitnehmer</div></div><div><div className="h-px bg-slate-300 mb-2"></div><div className="text-[10px] uppercase font-bold text-slate-400">Unterschrift Vorgesetzter</div></div></div><div className="text-center mt-8 text-[9px] text-slate-300 uppercase tracking-widest">Generiert mit Tina AI Marienhof • {new Date().toLocaleString('de-DE')}</div></footer>
        </div>

        {/* PRINT PAGE 2: MONTHLY REPORT */}
        <div className="print-portrait-wrapper break-before-page bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl print:shadow-none p-[15mm] md:p-[20mm] relative text-slate-800 text-sm leading-normal animate-fade-in">
             <header className="border-b-4 border-marien-500 pb-6 mb-10"><h2 className="text-4xl font-black text-slate-900 uppercase mb-2">Monatsbericht</h2><div className="text-xl text-marien-600 font-bold uppercase tracking-widest">{new Date(selectedDate).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</div></header>
             <section className="mb-12"><h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2">Leistungsübersicht</h3><div className="grid grid-cols-3 gap-6"><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center"><div className="text-3xl font-black text-marien-800 mb-1">{monthStats.workDays}</div><div className="text-[10px] uppercase font-bold text-slate-400">Arbeitstage</div></div><div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center"><div className="text-3xl font-black text-marien-800 mb-1">{monthStats.totalTime}</div><div className="text-[10px] uppercase font-bold text-slate-400">Gesamtstunden</div></div><div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center"><div className="text-3xl font-black text-red-600 mb-1">{monthStats.overtime}</div><div className="text-[10px] uppercase font-bold text-red-400">Überstunden</div></div><div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center"><div className="text-3xl font-black text-blue-600 mb-1">{monthStats.vacationDays}</div><div className="text-[10px] uppercase font-bold text-blue-400">Urlaubstage</div></div><div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center"><div className="text-3xl font-black text-orange-600 mb-1">{monthStats.sickDays}</div><div className="text-[10px] uppercase font-bold text-orange-400">Krankheitstage</div></div><div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-center"><div className="text-3xl font-black text-purple-600 mb-1">{monthStats.eventCount}</div><div className="text-[10px] uppercase font-bold text-purple-400">Termine</div></div></div></section>
             <section className="mb-12"><h3 className="text-sm font-bold uppercase text-slate-400 tracking-widest mb-4 border-b border-slate-200 pb-2">Ereignisprotokoll</h3>{monthEvents.length > 0 ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{monthEvents.sort((a,b) => a.datum.localeCompare(b.datum)).map(ev => (<div key={ev.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-lg bg-white"><div className="w-10 h-10 bg-slate-50 rounded flex items-center justify-center font-bold text-slate-400 shrink-0 flex-col leading-none"><span className="text-[8px] uppercase">{new Date(ev.datum).toLocaleDateString('de-DE', {month:'short'})}</span><span className="text-sm text-slate-800">{new Date(ev.datum).getDate()}</span></div><div><div className="text-xs font-bold text-slate-800">{ev.titel}</div><div className="text-[10px] uppercase text-slate-400">{ev.typ}</div></div></div>))}</div>) : (<div className="text-slate-400 italic">Keine besonderen Ereignisse in diesem Monat.</div>)}</section>
        </div>

        {/* SCREEN ONLY: EXPORT BUTTONS */}
        <div className="w-full max-w-[210mm] mt-8 mb-12 px-4 no-print">
            <DateNavigation onPrev={handlePrevDay} onToday={handleToday} onNext={handleNextDay} />
            <div className="mt-8 bg-white rounded-2xl shadow-card border border-marien-100 p-6">
                <h3 className="text-lg font-bold text-marien-900 mb-4 flex items-center gap-2"><span>📤</span> Exportieren & Teilen</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={handlePrint} className="flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 hover:bg-marien-50 border-2 border-gray-200 hover:border-marien-300 transition-all group"><div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">🖨️</div><div className="font-bold text-marien-900">Als PDF speichern / Drucken</div><div className="text-xs text-gray-500 mt-1 text-center">Öffnet Druckdialog.<br/>Wähle "Als PDF speichern".</div></button>
                    <button onClick={handleEmail} className="flex flex-col items-center justify-center p-6 rounded-xl bg-gray-50 hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-300 transition-all group"><div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center text-2xl shadow-sm mb-3 group-hover:scale-110 transition-transform">📧</div><div className="font-bold text-blue-900">Per E-Mail vorbereiten</div><div className="text-xs text-gray-500 mt-1 text-center">Öffnet Mail-App. <br/> <span className="text-red-500 font-bold">PDF manuell anhängen!</span></div></button>
                </div>
            </div>
        </div>
      </div>

      {/* ================================================================================== */}
      {/* VIEW 2: WEEKLY STATISTICS (NEW) */}
      {/* ================================================================================== */}
      {activeTab === 'weekly' && (
      <div className="w-full max-w-6xl px-4 animate-fade-in">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-3xl shadow-card border border-gray-100">
             <div className="flex flex-col">
                 <h2 className="text-3xl font-black text-marien-900 uppercase tracking-tight">Wochenstatistik</h2>
                 <p className="text-marien-500 font-bold">
                     KW {Math.ceil(((new Date(weekRange.start).getTime() - new Date(new Date(weekRange.start).getFullYear(), 0, 1).getTime()) / 86400000 + 1) / 7)} • {weekRange.start.toLocaleDateString('de-DE')} - {weekRange.end.toLocaleDateString('de-DE')}
                 </p>
             </div>
             <Button variant="secondary" onClick={() => handleExportCsv(weekEntries, 'wochenexport.csv')} className="!rounded-full shadow-sm">💾 CSV Export (Woche)</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-center group">
                    <div className="text-marien-500 text-xs uppercase font-bold tracking-widest mb-2">Arbeitstage</div>
                    <div className="text-5xl font-black text-marien-900 group-hover:scale-110 transition-transform">{weekStats.workDays}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm text-center group">
                    <div className="text-marien-500 text-xs uppercase font-bold tracking-widest mb-2">Stunden</div>
                    <div className="text-5xl font-black text-marien-900">{weekStats.totalTime}</div>
                </div>
                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm text-center group">
                    <div className="text-red-400 text-xs uppercase font-bold tracking-widest mb-2">Überstunden</div>
                    <div className="text-5xl font-black text-red-600">{weekStats.overtime}</div>
                </div>
           </div>

           <div className="bg-white p-6 md:p-8 rounded-3xl border border-dashed border-marien-300/50 shadow-sm h-[350px] w-full relative mb-8">
                <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-marien-500"></span>Stundenverlauf (Mo-So)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} fontSize={12} />
                        <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                        <Bar dataKey="hours" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={30}>
                            {weekChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.hours > 8 ? '#f59e0b' : '#14b8a6'} />))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
               {weekEvents.length > 0 && (
                   <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                       <h3 className="text-sm font-bold uppercase text-gray-400 tracking-widest mb-4">Termine dieser Woche</h3>
                       <div className="space-y-2">
                           {weekEvents.map(ev => (
                               <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <span className="text-xl">{getEventSymbol(ev.typ)}</span>
                                    <div>
                                        <div className="font-bold text-gray-800">{ev.titel}</div>
                                        <div className="text-xs text-gray-500">{new Date(ev.datum).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })}</div>
                                    </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
           </div>

      </div>
      )}

      {/* ================================================================================== */}
      {/* VIEW 3: MONTHLY STATISTICS (THE DASHBOARD MERGED) */}
      {/* ================================================================================== */}
      {activeTab === 'monthly' && (
      <div className="w-full max-w-6xl px-4 animate-fade-in">
          
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 bg-white p-6 rounded-3xl shadow-card border border-gray-100">
             <h2 className="text-3xl font-black text-marien-900 uppercase tracking-tight">Monatsstatistik: {new Date(selectedDate).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</h2>
             <Button variant="secondary" onClick={() => handleExportCsv(monthEntries, 'monatsexport.csv')} className="!rounded-full shadow-sm">💾 CSV Export</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-marien-900 p-6 rounded-3xl border border-marien-800 shadow-float text-center group">
                    <div className="text-marien-400 text-xs uppercase font-bold tracking-widest mb-2">Arbeitstage</div>
                    <div className="text-5xl font-black text-white group-hover:scale-110 transition-transform">{monthStats.workDays}</div>
                </div>
                <div className="bg-marien-800 p-6 rounded-3xl border border-marien-700 shadow-float text-center group">
                    <div className="text-marien-400 text-xs uppercase font-bold tracking-widest mb-2">Gesamtstunden</div>
                    <div className="text-5xl font-black text-white">{monthStats.totalTime}</div>
                </div>
                <div className="bg-marien-700 p-6 rounded-3xl border border-marien-600 shadow-float text-center group">
                    <div className="text-marien-400 text-xs uppercase font-bold tracking-widest mb-2">Ø Stimmung</div>
                    <div className="text-5xl font-black text-fun-yellow">{monthStats.avgMood} <span className="text-lg text-marien-400 font-medium">/ 5</span></div>
                </div>
           </div>

           <div className="space-y-8 mb-12">
               {/* CHART 1: HOURS */}
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-dashed border-marien-300/50 shadow-sm h-[350px] w-full relative">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-marien-500"></span>Arbeitszeitverlauf</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} fontSize={12} />
                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
                            <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                            <Bar dataKey="hours" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20}>
                                {monthChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.hours > 10 ? '#f59e0b' : '#14b8a6'} />))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
               </div>

               {/* CHART 2: MOOD */}
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-dashed border-fun-pink/30 shadow-sm h-[350px] w-full relative">
                    <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-fun-pink"></span>Stimmungsverlauf</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} fontSize={12} />
                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[0, 5]} ticks={[1,2,3,4,5]} fontSize={12} />
                            <Tooltip cursor={{ stroke: '#ec4899', strokeWidth: 2 }} contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px' }} />
                            <Area type="monotone" dataKey="moodScore" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                        </AreaChart>
                    </ResponsiveContainer>
               </div>
           </div>
      </div>
      )}

    </div>
  );
};

export default ProtocolPage;
