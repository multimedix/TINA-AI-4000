
import { ArbeitsEintrag, DienstTyp, PauseDauer, Bewertung, Notiz, KalenderEintrag, KalenderTyp, Aufgabe, GesundheitsEintrag } from '../types';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, query, where } from "firebase/firestore";

// --- KONFIGURATION ---
// HIER BITTE DIE FIREBASE DATEN EINFÜGEN
// Wenn diese leer sind, nutzt die App automatisch den LocalStorage (Offline Modus)
const firebaseConfig = {
  apiKey: "", // z.B. "AIzaSy..."
  authDomain: "", // z.B. "tina-marienhof.firebaseapp.com"
  projectId: "", // z.B. "tina-marienhof"
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// --- SYSTEM CHECK ---
let db: any = null;
let useFirebase = false;

try {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    useFirebase = true;
    console.log("Firebase initialisiert.");
  } else {
    console.log("Keine Firebase Config gefunden. Nutze LocalStorage.");
  }
} catch (e) {
  console.error("Firebase Fehler:", e);
  useFirebase = false;
}

const COLLECTION_NAME = "arbeits_eintraege";
const INFO_COLLECTION_NAME = "arbeits_infos";
const CALENDAR_COLLECTION_NAME = "arbeits_kalender";
const TASKS_COLLECTION_NAME = "arbeits_aufgaben";
const HEALTH_COLLECTION_NAME = "arbeits_gesundheit";

const LOCAL_STORAGE_KEY = "tina_marienhof_data";
const INFO_STORAGE_KEY = "tina_marienhof_infos";
const CALENDAR_STORAGE_KEY = "tina_marienhof_calendar";
const TASKS_STORAGE_KEY = "tina_marienhof_global_tasks";
const HEALTH_STORAGE_KEY = "tina_marienhof_health";

// --- DEMO DATA GENERATOR ---
const generateDemoData = (): ArbeitsEintrag[] => {
  const entries: ArbeitsEintrag[] = [];
  const today = new Date();
  
  const demoTitles = [
    "Sturzereignis", "Übergabe", "Personal", "Arztvisite", "Angehörige", "Material", "Bewohner", "Schulung"
  ];
  
  const demoTexts = [
    "Ruhiger Dienst, alles nach Plan.",
    "Bewohner in Zimmer 4 ist gestürzt, Protokoll geschrieben.",
    "Sehr stressig heute, Personalmangel.",
    "Super Teamarbeit, hat Spaß gemacht!",
    "Arztvisite dauerte länger als geplant.",
    "Angehörigengespräch geführt, sehr positiv.",
    "Materialbestellung erledigt.",
    "Übergabe war etwas chaotisch.",
    "Einweisung neuer Kollege.",
    "Feueralarm Probe durchgeführt."
  ];

  // Generate 365 days back (1 year)
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Random Seed Logic
    const rand = Math.random();
    let entry: ArbeitsEintrag = createDefaultEntry(dateStr);

    // Skip some weekends or random days off
    if (rand > 0.85) {
      entry.dienst = DienstTyp.FREI;
      entry.arbeitsBeginn = "";
      entry.arbeitsEnde = "";
      entry.arbeitsZeitNetto = "00:00";
      entry.pausenDauer = PauseDauer.KEINE;
      entry.bewertung = Bewertung.PERFEKT;
      entry.vorkommnisse = [{
        id: `free_${i}`,
        titel: "Freizeit",
        text: "Frei genossen.",
        erstelltAm: new Date().toISOString()
      }];
    } else if (rand > 0.83) {
      entry.dienst = DienstTyp.KRANK;
      entry.arbeitsBeginn = "";
      entry.arbeitsEnde = "";
      entry.arbeitsZeitNetto = "00:00";
      entry.pausenDauer = PauseDauer.KEINE;
      entry.bewertung = Bewertung.NAJA;
      entry.vorkommnisse = [{
        id: `sick_${i}`,
        titel: "Krankheit",
        text: "Krankmeldung eingereicht.",
        erstelltAm: new Date().toISOString()
      }];
    } else {
      // Working Days
      const typeRand = Math.random();
      
      if (typeRand > 0.6) {
        // FRÜHDIENST (Most common)
        entry.dienst = DienstTyp.FRUEH;
        entry.arbeitsBeginn = "06:00";
        entry.arbeitsEnde = "14:30";
        entry.pausenDauer = PauseDauer.MIN_30;
        entry.arbeitsZeitNetto = "08:00";
      } else if (typeRand > 0.3) {
        // SPÄTDIENST
        entry.dienst = DienstTyp.SPAET;
        entry.arbeitsBeginn = "13:30";
        entry.arbeitsEnde = "21:30";
        entry.pausenDauer = PauseDauer.MIN_30;
        entry.arbeitsZeitNetto = "07:30";
      } else {
        // GETEILT / NOT
        entry.dienst = DienstTyp.GETEILT;
        entry.arbeitsBeginn = "06:30";
        entry.arbeitsEnde = "16:00"; // Long day simulation
        entry.pausenDauer = PauseDauer.MIN_60;
        entry.arbeitsZeitNetto = "08:30";
      }

      // Random Colleagues (8 slots)
      entry.mitarbeiter = [
        Math.random() > 0.3, // Tina usually there
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.5,
        Math.random() > 0.7, // Teamleitung less often
        Math.random() > 0.8  // Chefin rare
      ];

      // Generate ratings for present colleagues
      entry.mitarbeiterStimmung = entry.mitarbeiter.map(isPresent => {
        if (!isPresent) return 5; // Default
        const moodR = Math.random();
        if (moodR > 0.95) return 1; // Dispute
        if (moodR > 0.85) return 3; // Naja
        return 5; // Good
      });

      // Random Mood
      const moodRand = Math.random();
      if (moodRand > 0.8) entry.bewertung = Bewertung.PERFEKT;
      else if (moodRand > 0.5) entry.bewertung = Bewertung.GUT;
      else if (moodRand > 0.2) entry.bewertung = Bewertung.NAJA;
      else if (moodRand > 0.1) entry.bewertung = Bewertung.SCHLECHT;
      else entry.bewertung = Bewertung.KATASTROPHE;

      // Random Notes
      if (Math.random() > 0.7) {
        const count = Math.floor(Math.random() * 2) + 1;
        const notes: Notiz[] = [];
        for(let n=0; n<count; n++) {
           notes.push({
             id: Math.random().toString(36).substr(2, 9),
             titel: demoTitles[Math.floor(Math.random() * demoTitles.length)],
             text: demoTexts[Math.floor(Math.random() * demoTexts.length)],
             erstelltAm: new Date().toISOString()
           });
        }
        entry.vorkommnisse = notes;
      }
    }
    entries.push(entry);
  }
  return entries;
};


// --- SYSTEM STATUS ---
export const checkDatabaseConnection = async (): Promise<{ connected: boolean; type: 'FIREBASE' | 'LOCAL' }> => {
  if (!useFirebase) {
    // Ensure local data exists on startup
    getLocalEntries(); 
    return { connected: true, type: 'LOCAL' };
  }
  try {
    // Try to fetch a dummy query to test connection
    await getDocs(query(collection(db, COLLECTION_NAME), where("id", "==", "test_connectivity")));
    return { connected: true, type: 'FIREBASE' };
  } catch (e) {
    console.warn("Firebase Verbindungstest fehlgeschlagen, falle zurück auf LocalStorage", e);
    return { connected: false, type: 'FIREBASE' };
  }
};

// --- DATA METHODS ---

export const getEntries = async (): Promise<ArbeitsEintrag[]> => {
  if (useFirebase && db) {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      const docs = snapshot.docs.map(doc => doc.data() as ArbeitsEintrag);
      if (docs.length === 0) return getLocalEntries(); // Fallback/Init if empty
      return docs;
    } catch (e) {
      console.error("Fehler beim Laden aus Firebase:", e);
      return getLocalEntries();
    }
  }
  return getLocalEntries();
};

export const getEntryByDate = async (dateStr: string): Promise<ArbeitsEintrag | null> => {
  if (useFirebase && db) {
    try {
       const entries = await getEntries();
       return entries.find(e => e.id === dateStr) || null;
    } catch (e) {
      return getLocalEntryByDate(dateStr);
    }
  }
  return getLocalEntryByDate(dateStr);
};

export const saveEntry = async (entry: ArbeitsEintrag): Promise<void> => {
  // Always save local for redundancy
  saveLocalEntry(entry);

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, COLLECTION_NAME, entry.id), entry);
      return;
    } catch (e) {
      console.error("Fehler beim Speichern in Firebase:", e);
    }
  }
};

export const loginUser = async (email: string, pass: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (email && pass) {
      resolve();
    } else {
      reject(new Error("Login required"));
    }
  });
};

// --- GLOBAL INFO NOTES METHODS ---

export const getInfoNotes = async (): Promise<Notiz[]> => {
    const data = localStorage.getItem(INFO_STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    } else {
        // Default/Demo Info Notes
        const defaultInfos: Notiz[] = [
            { id: "i1", titel: "Notfallnummern", text: "Zentrale: 112\nStationszimmer: 204\nOberarzt: 399", erstelltAm: new Date().toISOString() },
            { id: "i2", titel: "Bedienung Blutzuckergerät", text: "1. Teststreifen einlegen\n2. Tropfen Blut auftragen\n3. Warten bis Signal ertönt\n4. Wert dokumentieren", erstelltAm: new Date().toISOString() },
            { id: "i3", titel: "Wichtiges zur Übergabe", text: "Immer Besonderheiten bei Zimmer 4 und 8 erwähnen. Frau Müller braucht morgens Unterstützung beim Essen.", erstelltAm: new Date().toISOString() },
            { id: "i4", titel: "Hygienestandards", text: "Händedesinfektion vor und nach jedem Patientenkontakt.\nBei MRSA Isolation beachten (Schutzkittel, Handschuhe, Mundschutz).", erstelltAm: new Date().toISOString() },
            { id: "i5", titel: "Urlaubsantrag Prozess", text: "Urlaubsanträge müssen bis zum 15. des Vormonats bei der Teamleitung eingereicht werden.", erstelltAm: new Date().toISOString() }
        ];
        saveInfoNotes(defaultInfos);
        return defaultInfos;
    }
};

export const saveInfoNotes = async (notes: Notiz[]): Promise<void> => {
    localStorage.setItem(INFO_STORAGE_KEY, JSON.stringify(notes));
    
    // Optional: Sync to Firebase if we wanted
    if (useFirebase && db) {
        try {
           await setDoc(doc(db, INFO_COLLECTION_NAME, "global_infos"), { notes });
        } catch(e) { console.error(e); }
    }
};

// --- GLOBAL TASKS METHODS ---

export const getGlobalTasks = async (): Promise<Aufgabe[]> => {
    const data = localStorage.getItem(TASKS_STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    } else {
        // Default Demo Tasks
        const defaultTasks: Aufgabe[] = [
            { id: "t1", text: "Dienstplan für nächsten Monat prüfen", erledigt: false },
            { id: "t2", text: "Kaffee für die Station kaufen", erledigt: true },
            { id: "t3", text: "Fortbildung 'Wundmanagement' buchen", erledigt: false }
        ];
        saveGlobalTasks(defaultTasks);
        return defaultTasks;
    }
};

export const saveGlobalTasks = async (tasks: Aufgabe[]): Promise<void> => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    
    if (useFirebase && db) {
        try {
           await setDoc(doc(db, TASKS_COLLECTION_NAME, "global_tasks"), { tasks });
        } catch(e) { console.error(e); }
    }
};

// --- HEALTH / MOOD METHODS (NEW) ---

export const getHealthEntry = async (dateStr: string): Promise<GesundheitsEintrag> => {
    const data = localStorage.getItem(HEALTH_STORAGE_KEY);
    let allEntries: GesundheitsEintrag[] = data ? JSON.parse(data) : [];
    
    const entry = allEntries.find(e => e.datum === dateStr);
    
    if (entry) return entry;
    
    // Default Empty Entry
    return {
        datum: dateStr,
        koerperlich: 75, // Default ~Good
        seelisch: 75,
        geistig: 75,
        symptome: [],
        gruende: []
    };
};

export const getAllHealthEntries = async (): Promise<GesundheitsEintrag[]> => {
    const data = localStorage.getItem(HEALTH_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

export const saveHealthEntry = async (entry: GesundheitsEintrag): Promise<void> => {
    const data = localStorage.getItem(HEALTH_STORAGE_KEY);
    let allEntries: GesundheitsEintrag[] = data ? JSON.parse(data) : [];
    
    const index = allEntries.findIndex(e => e.datum === entry.datum);
    if (index >= 0) {
        allEntries[index] = entry;
    } else {
        allEntries.push(entry);
    }
    
    localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(allEntries));
    
    if (useFirebase && db) {
        try {
           await setDoc(doc(db, HEALTH_COLLECTION_NAME, entry.datum), entry);
        } catch(e) { console.error(e); }
    }
};

// --- CALENDAR EVENT METHODS ---

export const getCalendarEvents = async (): Promise<KalenderEintrag[]> => {
    const data = localStorage.getItem(CALENDAR_STORAGE_KEY);
    if (data) {
        return JSON.parse(data);
    } else {
        // Create rich demo events for the current year
        const today = new Date();
        const year = today.getFullYear();
        const events: KalenderEintrag[] = [];
        
        // Monthly Team Meetings
        for(let m=0; m<12; m++) {
            const d = new Date(year, m, 5); // 5th of every month
            // Skip weekends roughly
            if (d.getDay() === 0) d.setDate(d.getDate() + 1);
            if (d.getDay() === 6) d.setDate(d.getDate() + 2);

            events.push({
                id: `meet_${m}`,
                titel: "Team Meeting",
                datum: d.toISOString().split('T')[0],
                typ: KalenderTyp.INTERN,
                beschreibung: "Monatliche Besprechung Schichtplan & Aktuelles"
            });
        }

        // Birthdays
        events.push({ id: "bd1", titel: "Gaby Geburtstag", datum: `${year}-03-15`, typ: KalenderTyp.GEBURTSTAG });
        events.push({ id: "bd2", titel: "Chefin Geburtstag", datum: `${year}-07-22`, typ: KalenderTyp.GEBURTSTAG });
        events.push({ id: "bd3", titel: "Klaas Geburtstag", datum: `${year}-11-02`, typ: KalenderTyp.GEBURTSTAG });
        events.push({ id: "bd4", titel: "Tina Geburtstag", datum: `${year}-05-20`, typ: KalenderTyp.GEBURTSTAG });

        // Trainings
        events.push({ id: "tr1", titel: "Erste Hilfe Kurs", datum: `${year}-04-10`, typ: KalenderTyp.SCHULUNG });
        events.push({ id: "tr2", titel: "Brandschutz", datum: `${year}-09-20`, typ: KalenderTyp.SCHULUNG });
        events.push({ id: "tr3", titel: "Wundmanagement", datum: `${year}-02-14`, typ: KalenderTyp.SCHULUNG });

        // Vacations
        events.push({ id: "vac1", titel: "Sommerurlaub", datum: `${year}-08-01`, typ: KalenderTyp.URLAUB });
        events.push({ id: "vac2", titel: "Sommerurlaub", datum: `${year}-08-02`, typ: KalenderTyp.URLAUB });
        events.push({ id: "vac3", titel: "Sommerurlaub", datum: `${year}-08-03`, typ: KalenderTyp.URLAUB });
        events.push({ id: "vac4", titel: "Sommerurlaub", datum: `${year}-08-04`, typ: KalenderTyp.URLAUB });
        events.push({ id: "vac5", titel: "Sommerurlaub", datum: `${year}-08-05`, typ: KalenderTyp.URLAUB });
        
        // Misc
        events.push({ id: "misc1", titel: "Sommerfest", datum: `${year}-07-15`, typ: KalenderTyp.SONSTIGES });
        events.push({ id: "misc2", titel: "Weihnachtsfeier", datum: `${year}-12-18`, typ: KalenderTyp.SONSTIGES });

        saveCalendarEvents(events);
        return events;
    }
};

export const saveCalendarEvents = async (events: KalenderEintrag[]): Promise<void> => {
    localStorage.setItem(CALENDAR_STORAGE_KEY, JSON.stringify(events));
    
    if (useFirebase && db) {
        try {
           await setDoc(doc(db, CALENDAR_COLLECTION_NAME, "global_calendar"), { events });
        } catch(e) { console.error(e); }
    }
};


// --- LOCAL STORAGE FALLBACKS ---

const getLocalEntries = (): ArbeitsEintrag[] => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (data) {
    return JSON.parse(data);
  } else {
    // Initialize with Demo Data if empty!
    console.log("Generating 1 year of demo data...");
    const demoData = generateDemoData();
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demoData));
    return demoData;
  }
};

const getLocalEntryByDate = (dateStr: string): ArbeitsEintrag | null => {
  const entries = getLocalEntries();
  return entries.find(e => e.id === dateStr) || null;
};

const saveLocalEntry = (entry: ArbeitsEintrag) => {
  const entries = getLocalEntries();
  const index = entries.findIndex(e => e.id === entry.id);
  
  if (index >= 0) {
    entries[index] = entry;
  } else {
    entries.push(entry);
  }
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(entries));
};

// --- FACTORY ---

export const createDefaultEntry = (dateStr: string): ArbeitsEintrag => {
  return {
    id: dateStr,
    datum: dateStr,
    dienst: DienstTyp.FRUEH,
    arbeitsBeginn: "06:00",
    arbeitsEnde: "14:30",
    pausenDauer: PauseDauer.MIN_30,
    arbeitsZeitNetto: "08:00",
    // 8 Slots for: Tina, Gaby, Rezija, Klaas, Conny, Sandra, Teamleitung, Chefin
    mitarbeiter: [false, false, false, false, false, false, false, false],
    // Default ratings (5 = Stars/Good)
    mitarbeiterStimmung: [5, 5, 5, 5, 5, 5, 5, 5],
    bewertung: Bewertung.GUT,
    vorkommnisse: [],
    aufgaben: [] // Deprecated in UI, kept for data integrity
  };
};
