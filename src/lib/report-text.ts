import { DRIVE_FOLDER_NAME } from "@/data/catalog";
import { medianRiy, type Profile, type RankedProduct } from "@/lib/scoring";

const objectiveLabel: Record<Profile["objective"], string> = {
  protectie: "protecție",
  echilibrat: "echilibru între cost și creștere",
  crestere: "creștere",
};

function pct(n: number): string {
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 2 });
}

export function buildReport(profile: Profile, ranked: RankedProduct[]): string {
  const when = new Date().toLocaleString("ro-RO", { dateStyle: "long", timeStyle: "short" });
  const top = ranked.filter((r) => r.eligible).slice(0, 3);
  const lines: string[] = [
    `# Raport Atlas KID — unit-linked`,
    ``,
    `Generat: ${when}`,
    `Folder Drive țintă: ${DRIVE_FOLDER_NAME}`,
    ``,
    `## Profil`,
    ``,
    `- Orizont: ${profile.horizon} ani`,
    `- Obiectiv: ${objectiveLabel[profile.objective]}`,
    `- SRI maxim acceptat: ${profile.maxSri}`,
    `- Capacitate de pierdere: ${profile.loss}`,
    `- Vârstă: ${profile.ageBand}`,
    `- Primă: ${profile.premiumMode}`,
    `- Sensibilitate la costuri: ${profile.costSensitivity}`,
    `- Acceptă euro: ${profile.euroOk ? "da" : "nu"}`,
    `- Acoperiri cerute: ${
      [
        profile.death ? "deces" : null,
        profile.accident ? "accident" : null,
        profile.disability ? "invaliditate" : null,
        profile.critical ? "boli grave" : null,
        profile.waiver ? "scutire de primă" : null,
      ]
        .filter(Boolean)
        .join(", ") || "niciuna bifată"
    }`,
    ``,
    `Mediana RIY la perioada recomandată, pe fișa curentă: ${pct(medianRiy())}%/an.`,
    ``,
    `## Cele mai potrivite`,
    ``,
  ];

  if (!top.length) {
    lines.push("Niciun produs nu rămâne sub SRI-ul maxim din profil.");
  }

  top.forEach((row, index) => {
    const p = row.product;
    lines.push(`### ${index + 1}. ${p.insurer} — ${p.name} (${row.score}/100)`);
    lines.push("");
    lines.push(`- KID: ${p.kidUrl}`);
    lines.push(`- Data documentului: ${p.kidDate}`);
    lines.push(`- Exemplu din KID: ${p.exampleLabel}`);
    lines.push(`- Perioadă recomandată: ${p.rhpYears} ani · SRI ${p.sriMin}–${p.sriMax}`);
    lines.push(`- RIY: ${pct(p.riyMin)}–${pct(p.riyMax)}%/an · intrare reținută ${pct(p.frontLoadPct)}%`);
    row.reasons.forEach((reason) => lines.push(`- ${reason}`));
    row.warnings.forEach((warning) => lines.push(`- Atenție: ${warning}`));
    lines.push(`- ${p.caveat}`);
    lines.push("");
  });

  lines.push("## Clasament complet");
  lines.push("");
  lines.push("| Loc | Asigurător | Produs | Scor | RIY | Moderat | Potrivit |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  ranked.forEach((row, index) => {
    const p = row.product;
    const moderate =
      p.moderateMin == null || p.moderateMax == null
        ? "n/a"
        : `${pct(p.moderateMin)}–${pct(p.moderateMax)}%`;
    lines.push(
      `| ${index + 1} | ${p.insurer} | ${p.name} | ${row.score} | ${pct(p.riyMin)}–${pct(p.riyMax)}% | ${moderate} | ${row.eligible ? "da" : "nu"} |`,
    );
  });

  lines.push("");
  lines.push("## Cum se calculează scorul");
  lines.push("");
  lines.push(
    "Scorul combină cinci note de la 0 la 100: costul anual RIY la perioada recomandată (la orizont de 5 ani contează mult și costul din anul 1), comisionul reținut din primele de început, randamentul scenariului moderat după costuri, potrivirea dintre orizont / SRI și profil, și acoperirile cerute. Ponderile se mută spre protecție sau spre creștere în funcție de chestionar. Un produs cu SRI minim peste toleranță iese din lista potrivită, dar rămâne vizibil.",
  );
  lines.push("");
  lines.push(
    "Acesta nu este sfat de investiții și nu înlocuiește consultația IDD a distribuitorului. Scenariile din KID nu sunt previziuni. Cifrele sunt extrase din PDF-urile publice indicate și pot fi înlocuite de o ediție mai nouă. Înainte de cumpărare cereți KID-ul și condițiile pe produsul și fondul exact.",
  );
  lines.push("");
  return lines.join("\n");
}
