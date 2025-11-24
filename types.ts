
export enum DienstTyp {
  FRUEH = "Frühdienst",
  SPAET = "Spätdienst",
  GETEILT = "Geteilter Dienst",
  FREI = "Freizeit",
  KRANK = "Krankheit",
  NOT = "Notdienst"
}

export enum PauseDauer {
  MIN_30 = "30",
  MIN_45 = "45",
  MIN_60 = "60",
  STD_3 = "180",
  KEINE = "0"
}

export enum Bewertung {
  PERFEKT = "Perfekt",
  GUT = "Gut",
  NAJA = "Naja",
  SCHLECHT = "Schlecht",
  KATASTROPHE = "Katastrophe"
}

export enum KalenderTyp {
  INTERN = "Intern",
  GEBURTSTAG = "Geburtstag",
  SCHULUNG = "Schulung",
  URLAUB = "Urlaub",
  SONSTIGES = "Sonstiges"
}

export interface Aufgabe {
  id: string;
  text: string;
  erledigt: boolean;
}

export interface Notiz {
  id: string;
  titel: string;
  text: string;
  erstelltAm: string;
}

export interface KalenderEintrag {
  id: string;
  titel: string;
  datum: string; // YYYY-MM-DD
  typ: KalenderTyp;
  beschreibung?: string;
}

export interface GesundheitsEintrag {
  datum: string; // YYYY-MM-DD
  koerperlich: number; // 0-100
  seelisch: number; // 0-100
  geistig: number; // 0-100
  symptome: string[];
  gruende: Notiz[]; // Using Notiz structure for the "Why" list
}

export interface ArbeitsEintrag {
  id: string; // YYYY-MM-DD
  datum: string;
  dienst: DienstTyp;
  arbeitsBeginn: string; // HH:mm
  arbeitsEnde: string; // HH:mm
  pausenDauer: string; // Minuten als String
  arbeitsZeitNetto: string; // HH:mm
  mitarbeiter: boolean[]; // [ma1, ma2, ma3, ma4, ma5]
  mitarbeiterStimmung: number[]; // [5, 5, 1, 5...] 1-5 Stars per colleague
  bewertung: Bewertung;
  vorkommnisse: Notiz[]; // Changed from string to Notiz array
  aufgaben: Aufgabe[];
}
