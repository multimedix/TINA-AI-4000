
import React, { useState, useEffect, useMemo } from 'react';
import { Button, Input, Textarea } from '../components/UI';
import { generateMotivationalMessage, analyzeMonth } from '../services/geminiService';
import { getEntries, getHealthEntry, saveHealthEntry, getAllHealthEntries } from '../services/storageService';
import { ArbeitsEintrag, GesundheitsEintrag, Notiz } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, Cell } from 'recharts';

interface Props {
  selectedDate?: string;
}

const SYMPTOMS_LIST = [
  "Kopfschmerzen", "Rückenschmerzen", "Nackenschmerzen", "Schwere Beine/Füße",
  "Müdigkeit", "Erschöpfung", "Depression/Niedergeschlagen", "Gereiztheit",
  "Schlafstörungen", "Stress/Überforderung", "Übelkeit", "Erkältungssymptome"
];

const MoodPage: React.FC<Props> = ({ selectedDate: propDate }) => {
  const selectedDate = propDate || new Date().toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<'entry' | 'stats'>('entry');
  
  // --- HEALTH TRACKER STATE ---
  const [healthEntry, setHealthEntry] = useState<GesundheitsEintrag | null>(null);
  const [newReasonText, setNewReasonText] = useState("");
  const [newCustomSymptom, setNewCustomSymptom] = useState("");

  // --- STATS STATE ---
  const [history, setHistory] = useState<GesundheitsEintrag[]>([]);
  const [statsRange, setStatsRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  const loadData = async (dateStr: string) => {
    // 1. Load Health Entry for Selected Date
    const hEntry = await getHealthEntry(dateStr);
    setHealthEntry(hEntry);

    // 2. Load History for Charts
    const historyData = await getAllHealthEntries();
    setHistory(historyData);
  };

  const handleSaveHealth = async (updated: GesundheitsEintrag) => {
      setHealthEntry(updated);
      await saveHealthEntry(updated);
      // Refresh history immediately
      const historyData = await getAllHealthEntries();
      setHistory(historyData);
  };

  const updateSlider = (field: 'koerperlich' | 'seelisch' | 'geistig', val: number) => {
      if(!healthEntry) return;
      handleSaveHealth({ ...healthEntry, [field]: val });
  };

  const toggleSymptom = (sym: string) => {
      if(!healthEntry) return;
      const current = healthEntry.symptome || [];
      const updated = current.includes(sym) 
        ? current.filter(s => s !== sym)
        : [...current, sym];
      handleSaveHealth({ ...healthEntry, symptome: updated });
  };
  
  const addCustomSymptom = () => {
      if(!healthEntry || !newCustomSymptom.trim()) return;
      const sym = newCustomSymptom.trim();
      const current = healthEntry.symptome || [];
      if(!current.includes(sym)) {
          handleSaveHealth({ ...healthEntry, symptome: [...current, sym] });
      }
      setNewCustomSymptom("");
  };

  const addReason = () => {
      if(!healthEntry || !newReasonText.trim()) return;
      const newNote: Notiz = {
          id: Date.now().toString(),
          titel: "Grund",
          text: newReasonText,
          erstelltAm: new Date().toISOString()
      };
      handleSaveHealth({ ...healthEntry, gruende: [newNote, ...(healthEntry.gruende || [])] });
      setNewReasonText("");
  };

  const deleteReason = (id: string) => {
      if(!healthEntry) return;
      handleSaveHealth({ ...healthEntry, gruende: healthEntry.gruende.filter(g => g.id !== id) });
  };

  // --- RENDER HELPERS ---
  const getStatusLabel = (value: number, field: 'koerperlich' | 'seelisch' | 'geistig') => {
      if (field === 'koerperlich') {
          if (value < 20) return "Total erschöpft / Schmerzen";
          if (value < 40) return "Müde & Kraftlos";
          if (value < 60) return "Geht so / Okay";
          if (value < 80) return "Fit & Aktiv";
          return "Voller Energie & Topfit";
      }
      if (field === 'seelisch') {
          if (value < 20) return "Deprimiert / Traurig";
          if (value < 40) return "Gereizt / Gestresst";
          if (value < 60) return "Neutral / Ausgeglichen";
          if (value < 80) return "Gut gelaunt / Zufrieden";
          return "Glücklich & Dankbar";
      }
      // geistig
      if (value < 20) return "Unkonzentriert / Brainfog";
      if (value < 40) return "Abgelenkt / Müde";
      if (value < 60) return "Normaler Fokus";
      if (value < 80) return "Konzentriert & Klar";
      return "Hellwach & Im Flow";
  };

  const getStatusColor = (value: number) => {
      if (value < 30) return "text-red-500";
      if (value < 60) return "text-orange-500";
      if (value < 85) return "text-blue-500";
      return "text-green-500";
  };

  const renderSlider = (label: string, value: number, field: 'koerperlich' | 'seelisch' | 'geistig', icon: string) => {
      const statusText = getStatusLabel(value, field);
      const colorClass = getStatusColor(value);
      
      return (
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
            {/* Background Decoration */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -mr-8 -mt-8 ${value > 50 ? 'bg-teal-500' : 'bg-red-500'}`}></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-xl shadow-inner">
                        {icon}
                    </div>
                    <div>
                        <span className="font-bold text-marien-900 uppercase tracking-wide text-xs block opacity-60">{label}</span>
                        <span className={`font-black text-sm md:text-base leading-tight ${colorClass} transition-colors duration-300`}>
                            {statusText}
                        </span>
                    </div>
                </div>
                <div className={`font-black text-2xl ${colorClass} transition-colors duration-300`}>
                    {value}%
                </div>
            </div>

            <div className="relative h-8 w-full flex items-center z-10">
                 {/* Track Background */}
                 <div className="absolute w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                     <div className="w-full h-full bg-gradient-to-r from-red-400 via-orange-300 to-green-400 opacity-30"></div>
                 </div>
                 
                 {/* The Actual Input */}
                 <input 
                    type="range" 
                    min="0" max="100" step="5"
                    value={value}
                    onChange={(e) => updateSlider(field, parseInt(e.target.value))}
                    className="w-full h-2 bg-transparent appearance-none cursor-pointer z-20 focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-marien-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:mt-[-8px] [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full"
                />
            </div>
            
            <div className="flex justify-between text-[10px] text-gray-400 font-bold uppercase mt-1 px-1">
                <span>Kritisch</span>
                <span>Neutral</span>
                <span>Optimal</span>
            </div>
        </div>
      );
  };

  // --- STATS DATA PREP ---
  const filteredHistory = useMemo(() => {
      const now = new Date(selectedDate);
      const data = [...history].sort((a,b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
      
      if (statsRange === 'daily') {
          return data.filter(e => e.datum === selectedDate);
      }
      
      const days = statsRange === 'weekly' ? 7 : 30;
      const cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().split('T')[0];
      
      return data.filter(e => e.datum >= cutoffStr && e.datum <= selectedDate);
  }, [history, statsRange, selectedDate]);

  const chartData = useMemo(() => {
      return filteredHistory.map(e => ({
          name: statsRange === 'daily' ? 'Heute' : new Date(e.datum).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' }),
          date: e.datum,
          koerperlich: e.koerperlich,
          seelisch: e.seelisch,
          geistig: e.geistig
      }));
  }, [filteredHistory, statsRange]);

  const averages = useMemo(() => {
      if (filteredHistory.length === 0) return { k: 0, s: 0, g: 0 };
      const sum = filteredHistory.reduce((acc, curr) => ({
          k: acc.k + curr.koerperlich,
          s: acc.s + curr.seelisch,
          g: acc.g + curr.geistig
      }), { k: 0, s: 0, g: 0 });
      
      return {
          k: Math.round(sum.k / filteredHistory.length),
          s: Math.round(sum.s / filteredHistory.length),
          g: Math.round(sum.g / filteredHistory.length)
      };
  }, [filteredHistory]);

  if (!healthEntry) return <div className="p-8 text-center text-marien-600">Lade Gesundheitsdaten...</div>;

  return (
    <div className="h-full overflow-y-auto p-4 md:p-8 bg-gray-100">
       <div className="max-w-4xl mx-auto pb-24 space-y-8">
          
          {/* HEADER */}
          <header className="text-center animate-fade-in">
             <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-glow mb-6">
                <span className="text-5xl">🧘‍♀️</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-marien-900 mb-2 tracking-tight">Gesundheits-Check</h1>
             <p className="text-marien-600 font-medium">
                 {new Date(selectedDate).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
             </p>
          </header>

          {/* TABS */}
          <div className="flex justify-center mb-6">
              <div className="bg-white p-1 rounded-2xl shadow-sm border border-teal-100 flex">
                  <button 
                    onClick={() => setActiveTab('entry')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'entry' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Tages-Check
                  </button>
                  <button 
                    onClick={() => setActiveTab('stats')}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-teal-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    Verlauf & Statistik
                  </button>
              </div>
          </div>

          {/* === TAB 1: ENTRY === */}
          {activeTab === 'entry' && (
          <div className="animate-fade-in space-y-12">
            {/* 1. THE 3 PILLARS */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderSlider("Körperlich", healthEntry.koerperlich, 'koerperlich', '💪')}
                {renderSlider("Seelisch", healthEntry.seelisch, 'seelisch', '❤️')}
                {renderSlider("Geistig", healthEntry.geistig, 'geistig', '🧠')}
            </section>

            {/* 2. SYMPTOMS CHECKLIST */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-teal-100">
                <h2 className="text-xl font-bold text-marien-900 mb-6 flex items-center gap-2">
                    <span>🩺</span> Beschwerden & Symptome
                </h2>
                
                <div className="flex flex-wrap gap-3 mb-6">
                    {SYMPTOMS_LIST.map(sym => {
                        const isActive = healthEntry.symptome.includes(sym);
                        return (
                            <button
                                key={sym}
                                onClick={() => toggleSymptom(sym)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all transform active:scale-95 border ${
                                    isActive 
                                    ? 'bg-red-50 text-red-600 border-red-200 shadow-sm scale-105' 
                                    : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                                }`}
                            >
                                {isActive ? '⚠️ ' : ''}{sym}
                            </button>
                        );
                    })}
                    {/* Custom Symptoms Display */}
                    {healthEntry.symptome.filter(s => !SYMPTOMS_LIST.includes(s)).map(sym => (
                        <button
                            key={sym}
                            onClick={() => toggleSymptom(sym)}
                            className="px-4 py-2 rounded-xl text-sm font-bold transition-all transform active:scale-95 border bg-purple-50 text-purple-600 border-purple-200 shadow-sm scale-105"
                        >
                            ✏️ {sym}
                        </button>
                    ))}
                </div>

                {/* Add Custom Symptom */}
                <div className="flex gap-2 max-w-sm">
                    <Input 
                        placeholder="Anderes Symptom..."
                        value={newCustomSymptom}
                        onChange={(e) => setNewCustomSymptom(e.target.value)}
                        className="!bg-gray-50 !py-2 !text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && addCustomSymptom()}
                    />
                    <Button onClick={addCustomSymptom} disabled={!newCustomSymptom} className="!rounded-xl px-4 bg-gray-200 text-gray-700 hover:bg-gray-300">
                        +
                    </Button>
                </div>
            </section>

            {/* 3. WORRY JOURNAL */}
            <section className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-teal-100">
                <h2 className="text-xl font-bold text-marien-900 mb-6 flex items-center gap-2">
                    <span>📔</span> Warum geht es mir heute so?
                </h2>
                
                <div className="flex gap-2 mb-6">
                    <Input 
                        placeholder="Grund eintragen (z.B. Streit mit Angehörigen, Schlecht geschlafen)..."
                        value={newReasonText}
                        onChange={(e) => setNewReasonText(e.target.value)}
                        className="!bg-gray-50 !border-transparent focus:!bg-white shadow-inner"
                        onKeyDown={(e) => e.key === 'Enter' && addReason()}
                    />
                    <Button onClick={addReason} disabled={!newReasonText} className="!rounded-xl px-6 bg-teal-600 text-white shadow-teal-200">
                        +
                    </Button>
                </div>

                <div className="space-y-3">
                    {(!healthEntry.gruende || healthEntry.gruende.length === 0) && (
                        <p className="text-center text-gray-300 italic text-sm py-4">Keine Einträge. Hoffentlich weil alles gut ist!</p>
                    )}
                    {healthEntry.gruende?.map(g => (
                        <div key={g.id} className="flex items-center justify-between p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                            <span className="text-gray-700 font-medium">{g.text}</span>
                            <button 
                                onClick={() => deleteReason(g.id)}
                                className="text-orange-300 hover:text-red-500 transition-colors p-2"
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            </section>
          </div>
          )}

          {/* === TAB 2: STATISTICS === */}
          {activeTab === 'stats' && (
            <div className="animate-fade-in">
               
               {/* RANGE SELECTOR */}
               <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                   <h2 className="text-xl font-bold text-marien-900">Auswertung: {statsRange === 'daily' ? 'Tag' : statsRange === 'weekly' ? 'Woche' : 'Monat'}</h2>
                   <div className="flex bg-gray-100 p-1 rounded-xl">
                       <button onClick={() => setStatsRange('daily')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsRange === 'daily' ? 'bg-white shadow-sm text-marien-600' : 'text-gray-400'}`}>Tag</button>
                       <button onClick={() => setStatsRange('weekly')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsRange === 'weekly' ? 'bg-white shadow-sm text-marien-600' : 'text-gray-400'}`}>Woche</button>
                       <button onClick={() => setStatsRange('monthly')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${statsRange === 'monthly' ? 'bg-white shadow-sm text-marien-600' : 'text-gray-400'}`}>Monat</button>
                   </div>
               </div>

               {/* SUMMARY CARDS */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center group">
                        <div className="text-marien-500 text-xs uppercase font-bold tracking-widest mb-2">Körperlich Ø</div>
                        <div className={`text-5xl font-black ${getStatusColor(averages.k)} group-hover:scale-110 transition-transform`}>{averages.k}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center group">
                        <div className="text-marien-500 text-xs uppercase font-bold tracking-widest mb-2">Seelisch Ø</div>
                        <div className={`text-5xl font-black ${getStatusColor(averages.s)} group-hover:scale-110 transition-transform`}>{averages.s}%</div>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center group">
                        <div className="text-marien-500 text-xs uppercase font-bold tracking-widest mb-2">Geistig Ø</div>
                        <div className={`text-5xl font-black ${getStatusColor(averages.g)} group-hover:scale-110 transition-transform`}>{averages.g}%</div>
                    </div>
               </div>

               {/* CHART */}
               <div className="bg-white p-6 rounded-[2.5rem] shadow-card border border-gray-100 h-[400px] mb-8">
                   <h3 className="text-lg font-bold text-gray-700 mb-4 ml-2">Verlaufskurve</h3>
                   <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} fontSize={12} />
                            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[0, 100]} ticks={[0,25,50,75,100]} fontSize={12} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            <Line type="monotone" dataKey="koerperlich" name="Körperlich" stroke="#14b8a6" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} isAnimationActive={true} />
                            <Line type="monotone" dataKey="seelisch" name="Seelisch" stroke="#ec4899" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} isAnimationActive={true} />
                            <Line type="monotone" dataKey="geistig" name="Geistig" stroke="#8b5cf6" strokeWidth={3} dot={{r:4}} activeDot={{r:6}} isAnimationActive={true} />
                       </LineChart>
                   </ResponsiveContainer>
               </div>
               
               <p className="text-center text-gray-400 text-xs italic">
                   Daten basieren auf deinen täglichen Einträgen. {statsRange === 'daily' ? 'Zeigt Werte für den gewählten Tag.' : statsRange === 'weekly' ? 'Zeigt die letzten 7 Tage.' : 'Zeigt die letzten 30 Tage.'}
               </p>
            </div>
          )}

       </div>
    </div>
  );
};

export default MoodPage;