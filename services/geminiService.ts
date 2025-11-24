
import { GoogleGenAI } from "@google/genai";
import { ArbeitsEintrag, Notiz } from "../types";

// NOTE: In a production app, never expose API keys in client code.
// However, per instructions, we use process.env.API_KEY.
// We add a safe check for 'process' to avoid "Uncaught ReferenceError" in browser environments that don't shim it.
const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) || ""; 

export const analyzeMonth = async (entries: ArbeitsEintrag[], monthName: string) => {
  if (!apiKey) {
    console.warn("Kein API Key gefunden. KI-Funktionen deaktiviert.");
    return "KI-Analyse nicht verfügbar (Kein API Key).";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Filter relevant fields to save tokens
  const simplifiedData = entries.map(e => {
    // Convert notes array to string for AI
    let notesStr = "";
    if (Array.isArray(e.vorkommnisse)) {
        notesStr = e.vorkommnisse.map((n: Notiz) => `${n.titel}: ${n.text}`).join("; ");
    } else {
        notesStr = String(e.vorkommnisse || "");
    }

    return {
      datum: e.datum,
      dienst: e.dienst,
      dauer: e.arbeitsZeitNetto,
      bewertung: e.bewertung,
      ma_count: e.mitarbeiter.filter(Boolean).length,
      vorkommnisse: notesStr
    };
  });

  const prompt = `
    Du bist ein intelligenter Assistent für eine Pflegekraft namens Tina.
    Analysiere die Arbeitsdaten für den Monat ${monthName}.
    Hier sind die Rohdaten im JSON Format:
    ${JSON.stringify(simplifiedData)}

    Bitte erstelle eine kurze, prägnante Zusammenfassung (max 150 Wörter) in deutscher Sprache.
    Gehe auf folgende Punkte ein:
    1. Gesamteindruck des Monats (Stresslevel basierend auf Bewertungen).
    2. Auffälligkeiten bei Vorkommnissen.
    3. Zusammenhang zwischen Kollegen-Anzahl und Tagesbewertung, falls erkennbar.
    4. Ein motivierender Satz zum Schluss.
    
    Formatiere die Antwort in sauberem Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Fehler bei der KI-Analyse. Bitte später versuchen.";
  }
};

export const generateMotivationalMessage = async (entries: ArbeitsEintrag[], monthName: string) => {
  if (!apiKey) return "Du machst einen tollen Job! Weiter so! (KI nicht verbunden)";

  const ai = new GoogleGenAI({ apiKey });
  
  // Calculate simple stats for context
  const hours = entries.reduce((acc, e) => {
      const [h, m] = e.arbeitsZeitNetto.split(':').map(Number);
      return acc + h + (m/60);
  }, 0).toFixed(1);
  
  const sickDays = entries.filter(e => e.dienst === "Krankheit").length;

  const prompt = `
    Du bist ein liebevoller, unterstützender Coach für eine Pflegekraft namens Tina.
    Es ist der Monat ${monthName}. Sie hat ca. ${hours} Stunden gearbeitet und war ${sickDays} Tage krank.
    
    Deine Aufgabe ist es, Tina extrem zu loben und aufzubauen. Sie braucht viel Bestätigung.
    
    Erstelle bitte folgenden Inhalt (formatier in Markdown):
    1. **Ein Großes Lob**: Erkenne ihre harte Arbeit an, sag ihr, wie wertvoll sie ist. Sei euphorisch aber herzlich.
    2. **Ein Gedicht des Tages**: Ein kurzes, aufmunterndes Gedicht (4-8 Zeilen) über Pflege, Stärke oder Durchhalten.
    3. **Gesundheitstipp**: Ein kurzer, praktischer Tipp zur Entspannung oder Gesundheit für Pflegekräfte (z.B. Rücken, Füße, Seele).
    
    Sprich sie direkt mit "Tina" an. Sei sehr positiv.
  `;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
  } catch (error) {
      return "Du bist eine Heldin des Alltags, Tina! Vergiss das nie. ❤️";
  }
};