
import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, AreaChart, Area } from 'recharts';
import { getEntries } from '../services/storageService';
import { analyzeMonth } from '../services/geminiService';
import { ArbeitsEintrag, Bewertung, Notiz } from '../types';
import { Button } from '../components/UI';

const COLLEAGUES = ["Tina", "Gaby", "Rezija", "Klaas", "Conny", "Sandra", "Teamleitung", "Chefin"];

const Dashboard: React.FC = () => {
  const [entries, setEntries] = useState<ArbeitsEintrag[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getEntries();
    data.sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime());
    setEntries(data);
  };

  const handleRunAi = async () => {
    setLoadingAi(true);
    const currentMonthName = new Date().toLocaleString('de-DE', { month: 'long' });
    const result = await analyzeMonth(entries, currentMonthName);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const getNotesString = (e: ArbeitsEintrag) => {
      if (Array.isArray(e.vorkommnisse)) {
          return e.vorkommnisse.map((n: Notiz) => `[${n.titel}] ${n.text}`).join(" | ");
      }
      return String(e.vorkommnisse || "");
  };

  const handleExportCsv = () => {
    const headers = ["Datum", "Dienst", "Beginn", "Ende", "Pause", "Netto", ...COLLEAGUES, "Bewertung", "Notizen"];
    const rows = entries.map(e => [
      e.datum,
      e.dienst,
      e.arbeitsBeginn,
      e.arbeitsEnde,
      e.pausenDauer,
      e.arbeitsZeitNetto,
      ...COLLEAGUES.map((_, i) => {
          if (e.mitarbeiter[i]) {
              return e.mitarbeiterStimmung ? e.mitarbeiterStimmung[i] : "5";
          }
          return "";
      }),
      e.bewertung,
      `"${getNotesString(e).replace(/"/g, '""')}"` // CSV escape
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "marienhof_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculations
  const stats = useMemo(() => {
    let totalHours = 0;
    let totalMins = 0;
    let moodScore = 0;
    
    entries.forEach(e => {
      const [h, m] = e.arbeitsZeitNetto.split(':').map(Number);
      totalHours += h;
      totalMins += m;
      
      if (e.bewertung === Bewertung.PERFEKT) moodScore += 5;
      if (e.bewertung === Bewertung.GUT) moodScore += 4;
      if (e.bewertung === Bewertung.NAJA) moodScore += 3;
      if (e.bewertung === Bewertung.SCHLECHT) moodScore += 2;
      if (e.bewertung === Bewertung.KATASTROPHE) moodScore += 1;
    });

    totalHours += Math.floor(totalMins / 60);
    totalMins = totalMins % 60;

    const avgMood = entries.length ? (moodScore / entries.length).toFixed(1) : "0";

    return { totalHours, totalMins, avgMood, count: entries.length };
  }, [entries]);

  const moodMap: Record<string, number> = {
    [Bewertung.PERFEKT]: 5,
    [Bewertung.GUT]: 4,
    [Bewertung.NAJA]: 3,
    [Bewertung.SCHLECHT]: 2,
    [Bewertung.KATASTROPHE]: 1
  };

  const chartData = entries.map(e => {
      const [h, m] = e.arbeitsZeitNetto.split(':').map(Number);
      return {
          name: e.datum.split('-')[2], // Day
          date: e.datum,
          hours: h + (m/60),
          mood: e.bewertung,
          moodScore: moodMap[e.bewertung] || 0
      };
  });

  return (
    <div className="print-landscape-wrapper p-4 md:p-8 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6 print:mb-4 bg-white p-6 rounded-3xl shadow-card no-print border border-gray-100">
        <h1 className="text-3xl font-black text-marien-900 uppercase tracking-tight">Monats-Dashboard</h1>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handleExportCsv} className="!rounded-full shadow-sm">💾 CSV Export</Button>
          <Button variant="ghost" onClick={() => window.print()} className="!rounded-full bg-gray-100 hover:bg-gray-200">🖨️ Drucken</Button>
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-black uppercase tracking-wider mb-4 print-only hidden">Monats-Übersicht</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:grid-cols-3 print:gap-2 print:mb-4">
        <div className="bg-white print:bg-white print:border-black p-6 rounded-3xl border border-base-200 shadow-sm text-center group hover:shadow-card transition-all">
          <div className="text-marien-500 print:text-black text-xs uppercase font-bold tracking-widest mb-2">Dienste</div>
          <div className="text-5xl font-black text-marien-900 print-text-black group-hover:scale-110 transition-transform">{stats.count}</div>
        </div>
        <div className="bg-white print:bg-white print:border-black p-6 rounded-3xl border border-base-200 shadow-sm text-center group hover:shadow-card transition-all">
          <div className="text-marien-500 print:text-black text-xs uppercase font-bold tracking-widest mb-2">Gesamtstunden</div>
          <div className="text-5xl font-black text-marien-900 print-text-black">{stats.totalHours}<span className="text-2xl text-marien-400">:{stats.totalMins.toString().padStart(2,'0')}</span></div>
        </div>
        <div className="bg-white print:bg-white print:border-black p-6 rounded-3xl border border-base-200 shadow-sm text-center group hover:shadow-card transition-all">
          <div className="text-marien-500 print:text-black text-xs uppercase font-bold tracking-widest mb-2">Ø Stimmung</div>
          <div className="text-5xl font-black text-fun-yellow print-text-black">{stats.avgMood} <span className="text-lg text-gray-400 font-medium print-text-black">/ 5</span></div>
        </div>
      </div>

      <div className="space-y-8 mb-12 no-print">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-dashed border-marien-300/50 shadow-sm h-[350px] w-full relative">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-marien-500"></span>
            Arbeitszeitverlauf (1-31)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} fontSize={12} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} fontSize={12} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="hours" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.hours > 10 ? '#f59e0b' : '#14b8a6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-3xl border border-dashed border-fun-pink/30 shadow-sm h-[350px] w-full relative">
          <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-fun-pink"></span>
            Stimmungsverlauf (1-31)
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} dy={10} fontSize={12} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} domain={[0, 5]} ticks={[1,2,3,4,5]} fontSize={12} />
              <Tooltip 
                cursor={{ stroke: '#ec4899', strokeWidth: 2 }}
                contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Area type="monotone" dataKey="moodScore" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mb-12 no-print">
        {!aiAnalysis ? (
          <div className="bg-gradient-to-r from-marien-600 to-marien-800 p-1 rounded-3xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 w-full">
             <Button onClick={handleRunAi} disabled={loadingAi} className="w-full py-8 bg-marien-900/20 backdrop-blur-sm !text-white !text-2xl hover:bg-white/10 border-2 border-white/10 !rounded-2xl flex flex-col gap-2">
               <span className="text-4xl">✨</span>
               <span>{loadingAi ? "Analysiere Daten..." : "KI Analyse starten"}</span>
             </Button>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-3xl border-2 border-marien-500 shadow-float animate-fade-in relative overflow-hidden w-full">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-marien-400 via-fun-pink to-fun-purple"></div>
             <div className="flex justify-between items-start mb-6">
               <h3 className="text-2xl font-black text-marien-900 flex items-center gap-3">
                 <span className="text-3xl">✨</span> Gemini Auswertung
               </h3>
               <Button variant="ghost" onClick={() => setAiAnalysis(null)} className="text-sm">Schließen</Button>
             </div>
             <div className="prose prose-slate max-w-none">
               <pre className="whitespace-pre-wrap font-sans text-slate-700 text-lg leading-relaxed bg-gray-50 p-6 rounded-2xl border border-gray-100">
                 {aiAnalysis}
               </pre>
             </div>
          </div>
        )}
      </div>

      <div className="hidden print:block w-full bg-white">
        <h2 className="text-xl font-bold text-black mb-2 border-b-2 border-black pb-1">Detaillierte Arbeitszeitaufzeichnung</h2>
        <table className="w-full text-left text-xs border-collapse table-auto">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="p-1 border border-gray-300 font-bold w-20">Datum</th>
              <th className="p-1 border border-gray-300 font-bold w-24">Dienst</th>
              <th className="p-1 border border-gray-300 font-bold w-10 text-center">AB</th>
              <th className="p-1 border border-gray-300 font-bold w-10 text-center">PA</th>
              <th className="p-1 border border-gray-300 font-bold w-10 text-center">AE</th>
              <th className="p-1 border border-gray-300 font-bold w-12 text-center">AZ</th>
              {COLLEAGUES.map(name => (
                <th key={name} className="p-1 border border-gray-300 font-bold text-center w-6 truncate" style={{maxWidth: '30px', fontSize: '8px'}}>{name.substring(0, 3)}</th>
              ))}
              <th className="p-1 border border-gray-300 font-bold w-16">Note</th>
              <th className="p-1 border border-gray-300 font-bold">Notizen / Vorkommnisse</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, idx) => (
              <tr key={e.id} className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                <td className="p-1 border border-gray-300">{new Date(e.datum).toLocaleDateString('de-DE')}</td>
                <td className="p-1 border border-gray-300">{e.dienst}</td>
                <td className="p-1 border border-gray-300 text-center font-mono">{e.arbeitsBeginn}</td>
                <td className="p-1 border border-gray-300 text-center font-mono">{e.pausenDauer}</td>
                <td className="p-1 border border-gray-300 text-center font-mono">{e.arbeitsEnde}</td>
                <td className="p-1 border border-gray-300 text-center font-mono font-bold">{e.arbeitsZeitNetto}</td>
                
                {COLLEAGUES.map((_, mIdx) => {
                   const active = e.mitarbeiter[mIdx];
                   const rating = e.mitarbeiterStimmung ? e.mitarbeiterStimmung[mIdx] : 5;
                   return (
                     <td key={mIdx} className="p-1 border border-gray-300 text-center">
                       {active ? <span className={`font-bold ${rating <= 2 ? 'text-red-600' : 'text-black'}`}>{rating}</span> : <span className="text-gray-200">.</span>}
                     </td>
                   );
                })}

                <td className="p-1 border border-gray-300 truncate">{e.bewertung}</td>
                <td className="p-1 border border-gray-300 text-xs leading-tight">
                  {getNotesString(e).substring(0, 80) + (getNotesString(e).length > 80 ? "..." : "")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold border-t-2 border-black">
              <td colSpan={5} className="p-2 text-right">Gesamt:</td>
              <td className="p-2 text-center font-mono text-sm">{stats.totalHours}:{stats.totalMins.toString().padStart(2,'0')}</td>
              <td colSpan={COLLEAGUES.length + 2}></td>
            </tr>
          </tfoot>
        </table>
        
        <div className="mt-8 flex justify-end">
             <div className="w-64 border-t border-black pt-2 text-center text-xs">
                Geprüft am: ______________ Unterschrift: __________________
             </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;