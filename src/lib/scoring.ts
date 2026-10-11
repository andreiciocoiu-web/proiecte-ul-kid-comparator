import { PRODUCTS, type Product } from "@/data/catalog";

export type Objective = "protectie" | "echilibrat" | "crestere";
export type LossCapacity = "scazuta" | "medie" | "ridicata";
export type PremiumChoice = "unica" | "esalonata" | "indiferent";
export type CostSensitivity = "ridicata" | "medie" | "scazuta";
export type Horizon = 5 | 10 | 15 | 20;
export type AgeBand = "sub40" | "40-55" | "peste55";

export type Profile = {
  horizon: Horizon;
  objective: Objective;
  maxSri: number;
  loss: LossCapacity;
  death: boolean;
  accident: boolean;
  disability: boolean;
  critical: boolean;
  waiver: boolean;
  premiumMode: PremiumChoice;
  costSensitivity: CostSensitivity;
  euroOk: boolean;
  ageBand: AgeBand;
};

export const DEFAULT_PROFILE: Profile = {
  horizon: 10,
  objective: "echilibrat",
  maxSri: 4,
  loss: "medie",
  death: true,
  accident: false,
  disability: false,
  critical: false,
  waiver: false,
  premiumMode: "indiferent",
  costSensitivity: "ridicata",
  euroOk: false,
  ageBand: "40-55",
};

export type ScoreParts = {
  cost: number;
  commission: number;
  returns: number | null;
  fit: number;
  cover: number;
};

export type RankedProduct = {
  product: Product;
  score: number;
  parts: ScoreParts;
  weights: Record<keyof ScoreParts, number>;
  eligible: boolean;
  reasons: string[];
  warnings: string[];
};

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n));
const mid = (a: number, b: number) => (a + b) / 2;

function scoreFromRiy(riy: number): number {
  return clamp(Math.round(100 - (riy - 0.4) * 16));
}

function scoreFromReturn(value: number): number {
  return clamp(Math.round(42 + value * 8));
}

function wantedCovers(profile: Profile): (keyof Product["covers"])[] {
  const out: (keyof Product["covers"])[] = [];
  if (profile.death) out.push("death");
  if (profile.accident) out.push("accidentDeath");
  if (profile.disability) out.push("disability");
  if (profile.critical) out.push("criticalIllness");
  if (profile.waiver) out.push("waiver");
  return out;
}

function coverScore(product: Product, profile: Profile): number {
  const asked = wantedCovers(profile);
  if (asked.length === 0) return product.covers.death ? 60 : 45;
  const hits = asked.filter((key) => product.covers[key]).length;
  return Math.round((100 * hits) / asked.length);
}

function costScore(product: Product, profile: Profile): number {
  const atRhp = scoreFromRiy(mid(product.riyMin, product.riyMax));
  if (profile.horizon > 5) return atRhp;
  const early = product.year1Wipe
    ? 0
    : scoreFromRiy(product.riyYear1 ?? mid(product.riyMin, product.riyMax));
  return Math.round(atRhp * 0.4 + early * 0.6);
}

function commissionScore(product: Product): number {
  return clamp(Math.round(100 - product.frontLoadPct * 1.15));
}

function returnScore(product: Product, profile: Profile): number | null {
  if (product.moderateMin == null || product.moderateMax == null) return null;
  const moderate = mid(product.moderateMin, product.moderateMax);
  let blended = moderate;
  if (
    profile.objective === "crestere" &&
    product.favorableMin != null &&
    product.favorableMax != null
  ) {
    blended = moderate * 0.65 + mid(product.favorableMin, product.favorableMax) * 0.35;
  }
  if (
    profile.objective === "protectie" &&
    product.stressMin != null &&
    product.stressMax != null
  ) {
    blended = moderate * 0.75 + mid(product.stressMin, product.stressMax) * 0.25;
  }
  let score = scoreFromReturn(blended);
  if (product.returnsPartial) score = Math.round(score * 0.82);
  return score;
}

function fitScore(product: Product, profile: Profile): number {
  const gap = Math.abs(product.rhpYears - profile.horizon);
  let horizon = clamp(100 - gap * 7);
  if (profile.horizon <= 5 && product.year1Wipe) horizon = Math.min(horizon, 18);
  if (product.rhpYears >= 40 && profile.horizon <= 15) horizon = Math.min(horizon, 32);
  if (profile.ageBand === "peste55" && product.rhpYears >= 20) {
    horizon = Math.min(horizon, 55);
  }

  let sri = 100;
  if (product.sriMin > profile.maxSri) sri = 8;
  else if (product.sriMax > profile.maxSri) sri = 58;
  if (profile.loss === "scazuta" && product.sriMax >= 4) sri -= 18;
  if (profile.loss === "scazuta" && product.stressMax != null && product.stressMax < -8) {
    sri -= 10;
  }
  if (product.currency === "EUR" && !profile.euroOk) sri = Math.min(sri, 42);

  return clamp(Math.round(horizon * 0.62 + sri * 0.38));
}

function weightsFor(profile: Profile, hasReturn: boolean): Record<keyof ScoreParts, number> {
  const base =
    profile.objective === "protectie"
      ? { cost: 18, commission: 14, returns: 14, fit: 22, cover: 32 }
      : profile.objective === "crestere"
        ? { cost: 22, commission: 16, returns: 38, fit: 18, cover: 6 }
        : { cost: 26, commission: 18, returns: 26, fit: 20, cover: 10 };

  if (profile.costSensitivity === "ridicata") {
    base.cost += 8;
    base.commission += 6;
    base.returns = Math.max(0, base.returns - 8);
    base.cover = Math.max(0, base.cover - 6);
  } else if (profile.costSensitivity === "scazuta") {
    base.cost = Math.max(8, base.cost - 6);
    base.returns += 6;
  }
  if (!hasReturn) {
    base.cost += base.returns * 0.5;
    base.fit += base.returns * 0.5;
    base.returns = 0;
  }
  const sum = base.cost + base.commission + base.returns + base.fit + base.cover;
  return {
    cost: base.cost / sum,
    commission: base.commission / sum,
    returns: base.returns / sum,
    fit: base.fit / sum,
    cover: base.cover / sum,
  };
}

function fmtPct(n: number): string {
  return n.toLocaleString("ro-RO", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

function range(min: number, max: number): string {
  if (Math.abs(min - max) < 0.05) return `${fmtPct(min)}%`;
  return `${fmtPct(min)}–${fmtPct(max)}%`;
}

function buildReasons(product: Product, profile: Profile, parts: ScoreParts): string[] {
  const reasons: string[] = [];
  reasons.push(
    `Cost anual la ${product.rhpYears} ani (RIY): ${range(product.riyMin, product.riyMax)}.`,
  );
  if (product.frontLoadPct >= 8) {
    reasons.push(
      `Comision / primă reținută la intrare: ${fmtPct(product.frontLoadPct)}% din primele de început.`,
    );
  } else if (product.frontLoadPct > 0) {
    reasons.push(`Cost de intrare publicat: ${fmtPct(product.frontLoadPct)}%.`);
  } else {
    reasons.push("Fără comision de intrare în KID.");
  }
  if (product.moderateMin != null && product.moderateMax != null) {
    reasons.push(
      product.returnsPartial
        ? `Ilustrație de randament după costuri: ${range(product.moderateMin, product.moderateMax)}/an — nu este un scenariu PRIIPs complet.`
        : `Scenariul moderat la perioada recomandată: ${range(product.moderateMin, product.moderateMax)}/an, după costuri.`,
    );
  } else {
    reasons.push("KID-ul de produs nu publică scenarii de performanță; randamentul nu intră în scor.");
  }
  const asked = wantedCovers(profile);
  const labels: Record<keyof Product["covers"], string> = {
    death: "deces",
    accidentDeath: "deces din accident",
    disability: "invaliditate",
    criticalIllness: "boli grave",
    waiver: "scutire de primă",
  };
  if (asked.length) {
    const hit = asked.filter((k) => product.covers[k]).map((k) => labels[k]);
    const miss = asked.filter((k) => !product.covers[k]).map((k) => labels[k]);
    if (hit.length) reasons.push(`Acoperă: ${hit.join(", ")}.`);
    if (miss.length) reasons.push(`Nu acoperă din ce ați cerut: ${miss.join(", ")}.`);
  }
  if (parts.fit < 55) {
    reasons.push(
      `Perioada recomandată în KID este ${product.rhpYears} ani, față de orizontul de ${profile.horizon} ani din profil.`,
    );
  }
  return reasons.slice(0, 5);
}

function warningsFor(product: Product, profile: Profile): string[] {
  const warnings: string[] = [];
  if (product.sriMin > profile.maxSri) {
    warnings.push(
      `SRI ${product.sriMin}–${product.sriMax} este peste toleranța maximă ${profile.maxSri}.`,
    );
  } else if (product.sriMax > profile.maxSri) {
    warnings.push(
      `Doar programele cu SRI până la ${profile.maxSri} rămân în toleranță. Intervalul produsului este ${product.sriMin}–${product.sriMax}.`,
    );
  }
  if (product.currency === "EUR" && !profile.euroOk) {
    warnings.push("Contract în euro. Randamentul în lei depinde de curs.");
  }
  if (profile.premiumMode !== "indiferent" && product.premiumMode !== profile.premiumMode) {
    warnings.push(
      product.premiumMode === "unica"
        ? "Se plătește cu primă unică, nu eșalonat."
        : "Se plătește eșalonat, nu cu primă unică.",
    );
  }
  if (profile.horizon <= 5 && product.year1Wipe) {
    warnings.push("La ieșire în primul an, scenariul de supraviețuire este zero sau costul mănâncă prima.");
  }
  if (product.kidDate < "2025-01-01") {
    warnings.push(`KID din ${product.kidDate}. Poate exista o ediție mai nouă.`);
  }
  return warnings;
}

export function rankProducts(profile: Profile, products: Product[] = PRODUCTS): RankedProduct[] {
  return products
    .map((product) => {
      const returns = returnScore(product, profile);
      const parts: ScoreParts = {
        cost: costScore(product, profile),
        commission: commissionScore(product),
        returns,
        fit: fitScore(product, profile),
        cover: coverScore(product, profile),
      };
      const weights = weightsFor(profile, returns != null);
      let score =
        parts.cost * weights.cost +
        parts.commission * weights.commission +
        (parts.returns ?? 0) * weights.returns +
        parts.fit * weights.fit +
        parts.cover * weights.cover;
      if (profile.premiumMode !== "indiferent" && product.premiumMode !== profile.premiumMode) {
        score -= 8;
      }
      if (product.currency === "EUR" && !profile.euroOk) score -= 10;
      score = clamp(Math.round(score));
      const eligible = product.sriMin <= profile.maxSri;
      return {
        product,
        score,
        parts,
        weights,
        eligible,
        reasons: buildReasons(product, profile, parts),
        warnings: warningsFor(product, profile),
      };
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });
}

export function medianRiy(products: Product[] = PRODUCTS): number {
  const values = products.map((p) => mid(p.riyMin, p.riyMax)).sort((a, b) => a - b);
  const i = Math.floor(values.length / 2);
  return values.length % 2 ? values[i] : (values[i - 1] + values[i]) / 2;
}
