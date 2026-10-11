export type PremiumMode = "unica" | "esalonata";
export type Currency = "RON" | "EUR";

export type Product = {
  id: string;
  insurer: string;
  name: string;
  kidUrl: string;
  pageUrl: string;
  kidDate: string;
  premiumMode: PremiumMode;
  currency: Currency;
  exampleLabel: string;
  rhpYears: number;
  sriMin: number;
  sriMax: number;
  /** Annual cost drag at the recommended holding period, in percent. */
  riyMin: number;
  riyMax: number;
  /** Share of the first premium consumed by acquisition / not invested, 0–100. */
  frontLoadPct: number;
  entryNote: string;
  ongoingNote: string;
  /** True when the published year-1 survival scenario is zero or the cost impact is 100%. */
  year1Wipe: boolean;
  riyYear1: number | null;
  moderateMin: number | null;
  moderateMax: number | null;
  favorableMin: number | null;
  favorableMax: number | null;
  stressMin: number | null;
  stressMax: number | null;
  /** Before-cost annual return at RHP, when the KID states it. */
  grossMin: number | null;
  grossMax: number | null;
  /** Partial illustration, not a full PRIIPs performance table. */
  returnsPartial: boolean;
  covers: {
    death: boolean;
    accidentDeath: boolean;
    disability: boolean;
    criticalIllness: boolean;
    waiver: boolean;
  };
  earlyExitNote: string;
  caveat: string;
};

export const SCAN_PAGES: { id: string; insurer: string; url: string }[] = [
  {
    id: "metlife",
    insurer: "Metropolitan Life",
    url: "https://www.metropolitanlife.ro/ai-nevoie-de-ajutor/biblioteca-de-fonduri/informatii-esentiale/",
  },
  {
    id: "groupama",
    insurer: "Groupama",
    url: "https://www.groupama.ro/servicii/asigurarea-suplimentara-de-investitie-unit-linked",
  },
  {
    id: "grawe",
    insurer: "GRAWE",
    url: "https://www.grawe.ro/asigurare-ul/",
  },
  {
    id: "allianz",
    insurer: "Allianz-Țiriac",
    url: "https://www.allianztiriac.ro/ro_RO/documente-utile.html",
  },
  {
    id: "bcr",
    insurer: "BCR Asigurări de Viață",
    url: "https://www.bcrasigviata.ro/",
  },
  {
    id: "uniqa",
    insurer: "UNIQA",
    url: "https://www.uniqa.ro/",
  },
  {
    id: "nn",
    insurer: "NN",
    url: "https://www.nn.ro/",
  },
];

export const PRODUCTS: Product[] = [
  {
    id: "groupama-ul",
    insurer: "Groupama",
    name: "Asigurare suplimentară pentru investiție",
    kidUrl:
      "https://www.groupama.ro/wp-content/uploads/2026/08/KID-UL_rider_Generic_BT.pdf",
    pageUrl:
      "https://www.groupama.ro/servicii/asigurarea-suplimentara-de-investitie-unit-linked",
    kidDate: "2026-07-17",
    premiumMode: "unica",
    currency: "RON",
    exampleLabel: "primă unică 10.000 lei, mix 25% Prudent / Clasic / Dinamic / Maxim",
    rhpYears: 10,
    sriMin: 3,
    sriMax: 3,
    riyMin: 0.5,
    riyMax: 0.5,
    frontLoadPct: 5,
    entryNote:
      "Intrare 5% din primă (include costurile de distribuție). Ieșire până la 3% la răscumpărare totală în primul an.",
    ongoingNote:
      "Costuri recurente publicate 1,86%/an și tranzacționare 0,07%. RIY-ul din tabelul pe timp, la 10 ani, este 0,50%/an în scenariul moderat — cifra folosită la comparație.",
    year1Wipe: false,
    riyYear1: 8.01,
    moderateMin: 6.81,
    moderateMax: 6.81,
    favorableMin: 11.03,
    favorableMax: 11.03,
    stressMin: -5.33,
    stressMax: -5.33,
    grossMin: null,
    grossMax: null,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote: "Răscumpărare oricând; taxă până la 3% din valoarea răscumpărată.",
    caveat:
      "Rider unit-linked pe o asigurare de bază. Prima de risc a rider-ului este 0%; decesul este plătit prin polița de bază plus valoarea contului. Exemplul de scenarii este pe 10 ani, deși textul introductiv menționează și un caz de 3 ani.",
  },
  {
    id: "allianz-dinamic",
    insurer: "Allianz-Țiriac",
    name: "Dinamic Invest, primă unică RON",
    kidUrl:
      "https://www.allianztiriac.ro/content/dam/onemarketing/cee/azro/documente/kid/Document_cu_informatii_esentiale_-_Dinamic_Invest_prima_unica_RON_v5.pdf",
    pageUrl: "https://www.allianztiriac.ro/ro_RO/documente-utile.html",
    kidDate: "2024-04-04",
    premiumMode: "unica",
    currency: "RON",
    exampleLabel: "primă unică 45.000 lei; 43.650 lei intra în cont",
    rhpYears: 10,
    sriMin: 2,
    sriMax: 3,
    riyMin: 2.0,
    riyMax: 2.0,
    frontLoadPct: 0.3,
    entryNote:
      "Intrare 0,3% din prima. La 10 ani, impactul anual este 0,7% pe contract plus 1,3% pe opțiunile de investiții.",
    ongoingNote:
      "Administrare contract 0,4%/an din investiție. Taxa de asigurare 162 lei/an reduce randamentul pe 10 ani cu 0,2%. Înainte de costuri, KID-ul indică 4,1–9,2%/an.",
    year1Wipe: false,
    riyYear1: 8.2,
    moderateMin: 2.1,
    moderateMax: 7.2,
    favorableMin: 3.8,
    favorableMax: 9.0,
    stressMin: -9.6,
    stressMax: -2.6,
    grossMin: 4.1,
    grossMax: 9.2,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote:
      "Ieșirea înainte de 10 ani aduce costuri suplimentare; în primul an impactul anual al contractului este 8,2%.",
    caveat:
      "Document din aprilie 2024 — mai vechi decât celelalte KID-uri din fișă. Intervalele țin de programul de investiții ales (SRI 2 sau 3). Verificați versiunea curentă pe site.",
  },
  {
    id: "allianz-start",
    insurer: "Allianz-Țiriac",
    name: "Start Invest, primă eșalonată RON",
    kidUrl:
      "https://www.allianztiriac.ro/content/dam/onemarketing/cee/azro/documente/kid/Documente_cu_informatii_esentiale_Start_Invest_RON_prima_esalonata.pdf",
    pageUrl: "https://www.allianztiriac.ro/ro_RO/documente-utile.html",
    kidDate: "2024-04-04",
    premiumMode: "esalonata",
    currency: "RON",
    exampleLabel: "4.500 lei/an, 10 prime",
    rhpYears: 10,
    sriMin: 2,
    sriMax: 3,
    riyMin: 1.8,
    riyMax: 1.8,
    frontLoadPct: 0.5,
    entryNote:
      "Intrare 0,5% din prime. La 10 ani, impactul anual este 0,5% pe contract plus 1,3% pe opțiunile de investiții.",
    ongoingNote:
      "Costul riscului de deces, pentru un asigurat de 40 de ani, este 0,1% din prima investită și reduce randamentul cu 0,02%. Înainte de costuri: 4,1–9,2%/an.",
    year1Wipe: true,
    riyYear1: 100,
    moderateMin: 2.3,
    moderateMax: 7.4,
    favorableMin: 4.0,
    favorableMax: 9.2,
    stressMin: -9.5,
    stressMax: -2.4,
    grossMin: 4.1,
    grossMax: 9.2,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote:
      "În primul an scenariul de supraviețuire este 0 lei. Ieșirea anticipată are costuri suplimentare.",
    caveat:
      "KID aprilie 2024. Beneficiul la deces este maximul dintre suma asigurată plus cont și primele investite, minus răscumpărările parțiale. Intervalele depind de program.",
  },
  {
    id: "bcr-cia",
    insurer: "BCR Asigurări de Viață VIG",
    name: "Contul de Investiții cu Asigurare, unic lei",
    kidUrl:
      "https://bcr-adv-content-docs.s3.eu-central-1.amazonaws.com/Document_cu_Informatii_esentiale_CIA_-_unic_lei.pdf",
    pageUrl: "https://www.bcrasigviata.ro/",
    kidDate: "2025-09-01",
    premiumMode: "unica",
    currency: "RON",
    exampleLabel: "primă unică 50.000 lei; sumă investită în exemplu 49.500 lei",
    rhpYears: 45,
    sriMin: 2,
    sriMax: 3,
    riyMin: 0.88,
    riyMax: 0.88,
    frontLoadPct: 0.02,
    entryNote:
      "Cost de intrare 0,02%/an ca impact, inclusiv distribuția. La 1 an RIY este 9,82%; la 23 de ani 1,18%; la 45 de ani 0,88%.",
    ongoingNote:
      "Alte costuri recurente 0,85%/an (risc asigurat + administrare). Tranzacționare 0%. Calculul de cost presupune un fond cu 7,15%/an — nu este un scenariu de performanță.",
    year1Wipe: false,
    riyYear1: 9.82,
    moderateMin: null,
    moderateMax: null,
    favorableMin: null,
    favorableMax: null,
    stressMin: null,
    stressMax: null,
    grossMin: null,
    grossMax: null,
    returnsPartial: true,
    covers: {
      death: true,
      accidentDeath: true,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote:
      "Taxă de răscumpărare de cel mult 10% din valoarea contractului. La încetare anticipată se pierde protecția de deces.",
    caveat:
      "KID-ul nu publică scenarii de performanță la nivelul produsului (depind de fond). Sume minime la deces: 50.000 lei din orice cauză, 100.000 lei din accident, plus o sumă la accident rutier — verificați PDF-ul, extragerea textului lipește separatorul. Perioada din exemplu este 45 de ani.",
  },
  {
    id: "met-extra",
    insurer: "Metropolitan Life",
    name: "Invest Extra, primă unică, Leu Echilibrat",
    kidUrl:
      "https://www.metropolitanlife.ro/content/dam/metlifecom/ro/PDFs/informatii-esentiale-pdf/KID_Invest_Extra__prima_unica__-_Leu_Echilibrat_ian2026.pdf",
    pageUrl:
      "https://www.metropolitanlife.ro/ai-nevoie-de-ajutor/biblioteca-de-fonduri/informatii-esentiale/",
    kidDate: "2026-01-29",
    premiumMode: "unica",
    currency: "RON",
    exampleLabel: "2.000 lei primă unică, fond Leu Echilibrat",
    rhpYears: 18,
    sriMin: 3,
    sriMax: 3,
    riyMin: 2.1,
    riyMax: 2.1,
    frontLoadPct: 0,
    entryNote: "Fără comision de intrare. Răscumpărarea anticipată este gratuită, conform KID.",
    ongoingNote:
      "Impact anual al costurilor de tranzacționare la 18 ani: 2,12%. Textul mai menționează „5% din valoarea investiției pe an” ca estimare de tranzacționare — comparația folosește impactul anual din coloană (2,12%) și RIY 2,1%. Înainte de costuri: 4,2%/an.",
    year1Wipe: false,
    riyYear1: 7.1,
    moderateMin: 2.1,
    moderateMax: 2.1,
    favorableMin: 8.8,
    favorableMax: 8.8,
    stressMin: -10,
    stressMax: -10,
    grossMin: 4.2,
    grossMax: 4.2,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote: "Răscumpărare parțială sau totală înainte de maturitate, gratuit.",
    caveat:
      "La deces se plătește valoarea contului. Scenariul favorabil la 1 an (168,7%) este un maxim istoric pe un an și nu e folosit la scor; scorul ia randamentul la 18 ani.",
  },
  {
    id: "grawe-unic",
    insurer: "GRAWE România",
    name: "GRAWE INVEST, tarif FL33E, primă unică",
    kidUrl:
      "https://www.grawe.ro/fileadmin/grawe_ro/Downloads/documente_informatii_esentiale/UL/KID_UL_prima_unica.pdf",
    pageUrl: "https://www.grawe.ro/asigurare-ul/",
    kidDate: "2026-01-01",
    premiumMode: "unica",
    currency: "EUR",
    exampleLabel: "10.000 euro primă unică, asigurat 50 de ani, durată 15 ani",
    rhpYears: 15,
    sriMin: 3,
    sriMax: 4,
    riyMin: 1.3,
    riyMax: 2.3,
    frontLoadPct: 4,
    entryNote:
      "4% din prima unică (impact anualizat la 15 ani: 0,3% pe contract). Fără taxă inițială de emisiune în fond.",
    ongoingNote:
      "La 15 ani: 0,60%/an pe contract plus 0,7–1,7%/an pe fond. Exemplul de cost pleacă de la un fond cu 3%/an și ajunge la 2,42% după toate costurile. Prima de risc de deces în exemplu: 64,25 euro pe toată durata (0,04%/an).",
    year1Wipe: false,
    riyYear1: 40.2,
    moderateMin: 2.42,
    moderateMax: 2.42,
    favorableMin: null,
    favorableMax: null,
    stressMin: null,
    stressMax: null,
    grossMin: 3.75,
    grossMax: 4.59,
    returnsPartial: true,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote:
      "Răscumpărare din anul 2. Taxa de anulare poate ajunge la 36,72% din valoarea contului. În primul an impactul costului de contract este 40,2%.",
    caveat:
      "Contract în euro: există risc valutar față de leu, neinclus complet în decizia de scor decât dacă profilul acceptă euro. Nu există tabel complet de scenarii PRIIPs pe produs; 2,42% este ilustrația de cost, nu un scenariu moderat istoric.",
  },
  {
    id: "met-plus",
    insurer: "Metropolitan Life",
    name: "Invest Plus, Leu Echilibrat",
    kidUrl:
      "https://www.metropolitanlife.ro/content/dam/metlifecom/ro/PDFs/informatii-esentiale-pdf/KID_Invest_Plus_-_Leu_Echilibrat_ian2026.pdf",
    pageUrl:
      "https://www.metropolitanlife.ro/ai-nevoie-de-ajutor/biblioteca-de-fonduri/informatii-esentiale/",
    kidDate: "2026-01-29",
    premiumMode: "esalonata",
    currency: "RON",
    exampleLabel: "2.000 lei/an, fond Leu Echilibrat",
    rhpYears: 18,
    sriMin: 3,
    sriMax: 3,
    riyMin: 2.4,
    riyMax: 2.4,
    frontLoadPct: 50,
    entryNote:
      "50% din prima anului 1 și 50% din prima anului 2 nu rămân în investiție. Impactul anualizat al intrării la 18 ani este 0,46%.",
    ongoingNote:
      "Impact de tranzacționare 1,94%/an la scadență (textul menționează și 2%/an). Înainte de costuri 3,8%/an, după costuri 1,4%/an. La ieșire în anul 1, costul total este egal cu prima.",
    year1Wipe: true,
    riyYear1: 100,
    moderateMin: 1.4,
    moderateMax: 1.4,
    favorableMin: 5.4,
    favorableMax: 5.4,
    stressMin: -7.8,
    stressMax: -7.8,
    grossMin: 3.8,
    grossMax: 3.8,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote: "Răscumpărări parțiale sau totale; taxele sunt în condițiile contractuale.",
    caveat:
      "La deces, în anul 1, beneficiarii pot primi 1.055 lei în exemplul de 2.000 lei — sub prima plătită. Randamentul moderat la 18 ani este 1,4% după costuri.",
  },
  {
    id: "nn-invest",
    insurer: "NN Asigurări de Viață",
    name: "GenT pentru Investiție",
    kidUrl:
      "https://www.nn.ro/sites/default/files/2026-04/KID_GenT%20pentru%20Investitie_generic_04.2026.pdf",
    pageUrl: "https://www.nn.ro/",
    kidDate: "2026-04-17",
    premiumMode: "esalonata",
    currency: "RON",
    exampleLabel: "5.402 lei/an, din care 5.000 lei investiție și circa 7,5% primă de protecție",
    rhpYears: 20,
    sriMin: 3,
    sriMax: 4,
    riyMin: 2.7,
    riyMax: 5.1,
    frontLoadPct: 0,
    entryNote:
      "Cost de intrare 0% și de ieșire la maturitate 0%. Distribuția este marcată „nu se aplică” la intrare. Primele două polițe nu au valoare de răscumpărare.",
    ongoingNote:
      "Alte costuri recurente între 2,6% și 4,8%/an. Tranzacționare 0,2–0,3%/an. RIY la 20 de ani: 2,7–5,1%/an, în funcție de programul de investiții.",
    year1Wipe: true,
    riyYear1: 100,
    moderateMin: -3.6,
    moderateMax: 9.5,
    favorableMin: 0.6,
    favorableMax: 14.4,
    stressMin: -11.8,
    stressMax: -4.7,
    grossMin: null,
    grossMax: null,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote:
      "Fără valoare de răscumpărare în primii doi ani. După aceea, taxă proporțională cu durata rămasă; răscumpărarea parțială 1%.",
    caveat:
      "KID generic: fiecare cifră este un interval pe cele cinci programe. Riscul valutar RON/EUR este inclus în indicator. La deces, beneficiarii primesc suma asigurată plus valoarea contului.",
  },
  {
    id: "nn-pensie",
    insurer: "NN Asigurări de Viață",
    name: "GenT pentru Pensie",
    kidUrl:
      "https://www.nn.ro/sites/default/files/2026-04/KID_GenT%20pentru%20Pensie_generic_04.2026.pdf",
    pageUrl: "https://www.nn.ro/",
    kidDate: "2026-04-17",
    premiumMode: "esalonata",
    currency: "RON",
    exampleLabel: "aceeași structură de primă ca GenT Investiție în exemplul public: 5.000 lei investiți/an",
    rhpYears: 20,
    sriMin: 3,
    sriMax: 4,
    riyMin: 2.7,
    riyMax: 5.1,
    frontLoadPct: 0,
    entryNote: "Intrare 0%, ieșire la maturitate 0%. Fără valoare de răscumpărare în primii doi ani.",
    ongoingNote:
      "RIY la 20 de ani între 2,7% și 5,1%/an. Costuri recurente 2,6–4,8%/an, tranzacționare 0,2–0,3%/an.",
    year1Wipe: true,
    riyYear1: 100,
    moderateMin: -3.6,
    moderateMax: 9.5,
    favorableMin: 0.6,
    favorableMax: 14.4,
    stressMin: -11.8,
    stressMax: -4.7,
    grossMin: null,
    grossMax: null,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote: "Același regim de răscumpărare ca la GenT pentru Investiție: zero în primii doi ani.",
    caveat:
      "Produs orientat spre acumulare până spre vârsta de 60 de ani. Intervalele de scenariu din KID-ul generic coincid, în extras, cu cele de la GenT pentru Investiție — diferența de produs este orizontul și încadrarea de pensie, nu un cost mai mic.",
  },
  {
    id: "met-wise",
    insurer: "Metropolitan Life",
    name: "Wise Plan, Leu Echilibrat",
    kidUrl:
      "https://www.metropolitanlife.ro/content/dam/metlifecom/ro/PDFs/informatii-esentiale-pdf/-KID_Wise_Plan_-_Leu_Echilibrat_ian2026.pdf",
    pageUrl:
      "https://www.metropolitanlife.ro/ai-nevoie-de-ajutor/biblioteca-de-fonduri/informatii-esentiale/",
    kidDate: "2026-01-29",
    premiumMode: "esalonata",
    currency: "RON",
    exampleLabel: "4.000 lei/an, fond Leu Echilibrat",
    rhpYears: 18,
    sriMin: 3,
    sriMax: 3,
    riyMin: 3.2,
    riyMax: 3.2,
    frontLoadPct: 80,
    entryNote:
      "80% din prima anului 1 și 60% din prima anului 2 sunt cost de intrare. Impact anualizat la 18 ani: 0,80%.",
    ongoingNote:
      "Administrare 0,12%/an. Impact de tranzacționare 2,25%/an (textul menționează și „5% din valoarea investiției pe an”). Înainte de costuri 3,8%/an, după costuri 0,6%/an. Ieșirea în anul 1 consumă întreaga primă.",
    year1Wipe: true,
    riyYear1: 100,
    moderateMin: 0.6,
    moderateMax: 0.6,
    favorableMin: 4.4,
    favorableMax: 4.4,
    stressMin: -8.5,
    stressMax: -8.5,
    grossMin: 3.8,
    grossMax: 3.8,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: false,
      disability: false,
      criticalIllness: false,
      waiver: false,
    },
    earlyExitNote: "Răscumpărări înainte de maturitate, cu taxele din condițiile contractuale.",
    caveat:
      "În exemplul de deces din anul 1, beneficiarii primesc 8.000 lei la o primă de 4.000 lei — există o sumă asigurată, nu doar contul. Randamentul moderat după costuri, la 18 ani, este 0,6%/an.",
  },
  {
    id: "uniqa-fip",
    insurer: "UNIQA Asigurări de viață",
    name: "Future Invest Protect",
    kidUrl:
      "https://www.raiffeisen.ro/content/dam/rbi/retail/eu/ro/documents/pf/asigurari/asigurari-de-viata/componenta-investitionala/document-cu-informatii-esentiale-future-invest-protect/20250714-Document-cu-informatii-esentiale-Future-Invest-Protect.pdf.coredownload.pdf",
    pageUrl: "https://www.uniqa.ro/",
    kidDate: "2025-07-14",
    premiumMode: "esalonata",
    currency: "RON",
    exampleLabel: "2.400 lei/an în anul 1, din care doar 1.200 lei se investesc; indexare 3%",
    rhpYears: 20,
    sriMin: 3,
    sriMax: 3,
    riyMin: 5.48,
    riyMax: 5.93,
    frontLoadPct: 50,
    entryNote:
      "50% din prima totală este primă de risc și nu participă la investiție. KID-ul mai publică un impact de intrare de 50,35% pentru răscumpărarea după 5 ani — nu este RIY-ul la scadență.",
    ongoingNote:
      "Administrare 1,4–1,8%/an. Tranzacționare 0%. RIY la 20 de ani, inclusiv prima de risc: 5,48–5,93%/an. Înainte de costuri 4,67–5,87%/an; după costuri, scenariul moderat este negativ.",
    year1Wipe: true,
    riyYear1: 100,
    moderateMin: -4.4,
    moderateMax: -3.51,
    favorableMin: -2.91,
    favorableMax: -1.84,
    stressMin: -8.16,
    stressMax: -8.15,
    grossMin: 4.67,
    grossMax: 5.87,
    returnsPartial: false,
    covers: {
      death: true,
      accidentDeath: true,
      disability: true,
      criticalIllness: false,
      waiver: true,
    },
    earlyExitNote:
      "Valoarea de răscumpărare este 0 în primul an. După 5 ani nu se percepe comision de ieșire.",
    caveat:
      "Produs de protecție cu o componentă de investiție, nu un vehicul de acumulare ieftin. Acoperă deces din orice cauză, deces din accident, invaliditate permanentă totală și preluarea plății primelor. Chiar scenariul favorabil la 20 de ani rămâne negativ în KID (−2,91% până la −1,84%).",
  },
];

export const DRIVE_FOLDER_NAME = "KID Unit-Linked RO";
