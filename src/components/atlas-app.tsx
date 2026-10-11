import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Download,
  FolderOpen,
  RefreshCw,
  ScanSearch,
  Shield,
} from "lucide-react";
import { DRIVE_FOLDER_NAME, PRODUCTS, type Product } from "@/data/catalog";
import { syncDriveFolder, type DriveState } from "@/lib/drive.functions";
import { extractKid, scanMarket, type ScanResult } from "@/lib/kid.functions";
import { useProfileStore } from "@/lib/profile-store";
import { buildReport } from "@/lib/report-text";
import {
  medianRiy,
  rankProducts,
  type AgeBand,
  type CostSensitivity,
  type Horizon,
  type LossCapacity,
  type Objective,
  type PremiumChoice,
  type Profile,
  type RankedProduct,
} from "@/lib/scoring";
import {
  redirectToLoginIfRequired,
  useRefetchWhenConnectorReady,
} from "@/lib/app-data";

type Tab = "clasament" | "documente" | "raport";

const fmt = (n: number) =>
  n.toLocaleString("ro-RO", { maximumFractionDigits: 2 });

function range(min: number | null, max: number | null, suffix = "%") {
  if (min == null || max == null) return "—";
  if (Math.abs(min - max) < 0.05) return `${fmt(min)}${suffix}`;
  return `${fmt(min)}–${fmt(max)}${suffix}`;
}

function sriLabel(product: Product) {
  return product.sriMin === product.sriMax
    ? String(product.sriMin)
    : `${product.sriMin}–${product.sriMax}`;
}

function chartName(product: Product) {
  const names: Record<string, string> = {
    "groupama-ul": "Groupama",
    "allianz-dinamic": "AZ Dinamic",
    "allianz-start": "AZ Start",
    "bcr-cia": "BCR",
    "met-extra": "ML Extra",
    "grawe-unic": "GRAWE",
    "met-plus": "ML Plus",
    "nn-invest": "NN GenT",
    "nn-pensie": "NN Pensie",
    "met-wise": "Wise",
    "uniqa-fip": "UNIQA",
  };
  return names[product.id] ?? product.name;
}

export function AtlasApp() {
  const profile = useProfileStore((s) => s.profile);
  const setProfile = useProfileStore((s) => s.setProfile);
  const reset = useProfileStore((s) => s.reset);
  const ranked = useMemo(() => rankProducts(profile), [profile]);
  const suitable = ranked.filter((row) => row.eligible);
  const [tab, setTab] = useState<Tab>("clasament");
  const [openId, setOpenId] = useState<string | null>(suitable[0]?.product.id ?? null);

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-widest text-brass uppercase">
              România · PRIIPs
            </p>
            <h1 className="mt-1 text-3xl text-ink sm:text-4xl">Atlas KID</h1>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Compară produse unit-linked după cost, comision, scenariul moderat și
              acoperirile care se potrivesc profilului din chestionar.
            </p>
          </div>
          <p className="max-w-xs text-xs leading-5 text-muted">
            Mediana costului anual (RIY) în fișă:{" "}
            <span className="font-semibold text-ink tabular-nums">{fmt(medianRiy())}%</span>
            . Nu este recomandare de cumpărare.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <ProfileForm profile={profile} onChange={setProfile} onReset={reset} />
        </aside>
        <main className="min-w-0">
          <div className="no-print mb-4 flex gap-2 overflow-x-auto">
            {(
              [
                ["clasament", "Clasament"],
                ["documente", "Documente"],
                ["raport", "Raport și Drive"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
                  tab === id ? "bg-pine text-card" : "bg-card text-ink border border-line"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "clasament" && (
            <Ranking
              rows={ranked}
              openId={openId}
              onOpen={setOpenId}
              profile={profile}
            />
          )}
          {tab === "documente" && <Documents />}
          {tab === "raport" && <ReportPanel profile={profile} ranked={ranked} />}
        </main>
      </div>
    </div>
  );
}

function ProfileForm({
  profile,
  onChange,
  onReset,
}: {
  profile: Profile;
  onChange: (patch: Partial<Profile>) => void;
  onReset: () => void;
}) {
  return (
    <form className="rounded-xl border border-line bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl">Profilul clientului</h2>
        <button type="button" onClick={onReset} className="shrink-0 text-sm font-semibold text-pine">
          Resetează
        </button>
      </div>
      <Field label="Orizont">
        <Choice
          value={String(profile.horizon)}
          options={[
            ["5", "5 ani"],
            ["10", "10 ani"],
            ["15", "15 ani"],
            ["20", "20+ ani"],
          ]}
          onChange={(value) => onChange({ horizon: Number(value) as Horizon })}
        />
      </Field>
      <Field label="Ce urmărește">
        <Choice
          value={profile.objective}
          options={[
            ["protectie", "Protecție"],
            ["echilibrat", "Echilibru"],
            ["crestere", "Creștere"],
          ]}
          onChange={(value) => onChange({ objective: value as Objective })}
        />
      </Field>
      <Field label={`Risc maxim acceptat · SRI ${profile.maxSri}`}>
        <input
          type="range"
          min={2}
          max={6}
          step={1}
          value={profile.maxSri}
          onChange={(event) => onChange({ maxSri: Number(event.target.value) })}
          className="w-full accent-pine"
          aria-label="Indicator sintetic de risc maxim"
        />
        <p className="mt-1 text-xs text-muted">2 conservator · 4 mediu · 6 ridicat</p>
      </Field>
      <Field label="Dacă valoarea scade puternic un an">
        <Choice
          value={profile.loss}
          options={[
            ["scazuta", "Ieșire"],
            ["medie", "Aștept"],
            ["ridicata", "Cumpăr"],
          ]}
          onChange={(value) => onChange({ loss: value as LossCapacity })}
        />
      </Field>
      <Field label="Vârstă">
        <Choice
          value={profile.ageBand}
          options={[
            ["sub40", "Sub 40"],
            ["40-55", "40–55"],
            ["peste55", "Peste 55"],
          ]}
          onChange={(value) => onChange({ ageBand: value as AgeBand })}
        />
      </Field>
      <Field label="Acoperiri necesare">
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          <Check label="Deces" checked={profile.death} onChange={(death) => onChange({ death })} />
          <Check
            label="Accident"
            checked={profile.accident}
            onChange={(accident) => onChange({ accident })}
          />
          <Check
            label="Invaliditate"
            checked={profile.disability}
            onChange={(disability) => onChange({ disability })}
          />
          <Check
            label="Boli grave"
            checked={profile.critical}
            onChange={(critical) => onChange({ critical })}
          />
          <Check
            label="Scutire de primă"
            checked={profile.waiver}
            onChange={(waiver) => onChange({ waiver })}
          />
        </div>
      </Field>
      <Field label="Cum vrea să plătească">
        <Choice
          value={profile.premiumMode}
          options={[
            ["indiferent", "Oricum"],
            ["unica", "Primă unică"],
            ["esalonata", "Eșalonat"],
          ]}
          onChange={(value) => onChange({ premiumMode: value as PremiumChoice })}
        />
      </Field>
      <Field label="Cât cântăresc costurile">
        <Choice
          value={profile.costSensitivity}
          options={[
            ["ridicata", "Mult"],
            ["medie", "Mediu"],
            ["scazuta", "Puțin"],
          ]}
          onChange={(value) => onChange({ costSensitivity: value as CostSensitivity })}
        />
      </Field>
      <Check
        label="Acceptă un contract în euro"
        checked={profile.euroOk}
        onChange={(euroOk) => onChange({ euroOk })}
      />
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-4 block text-sm font-semibold text-ink">
      {label}
      <div className="mt-2 font-normal">{children}</div>
    </label>
  );
}

function Choice({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`h-11 rounded-full px-3 text-sm whitespace-nowrap ${
            value === id ? "bg-pine-deep text-card" : "bg-paper text-ink"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-2 text-sm font-normal text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 shrink-0 accent-pine"
      />
      <span>{label}</span>
    </label>
  );
}

function Ranking({
  rows,
  openId,
  onOpen,
  profile,
}: {
  rows: RankedProduct[];
  openId: string | null;
  onOpen: (id: string) => void;
  profile: Profile;
}) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const chart = rows
    .filter((row) => row.eligible)
    .slice(0, 6)
    .map((row) => ({
      name: chartName(row.product),
      riy: Number(((row.product.riyMin + row.product.riyMax) / 2).toFixed(2)),
      randament:
        row.product.moderateMin == null || row.product.moderateMax == null
          ? 0
          : Number(((row.product.moderateMin + row.product.moderateMax) / 2).toFixed(2)),
    }));

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-line bg-card p-4">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-xl">Cost și randament</h2>
          <p className="text-xs text-muted">RIY mai mic e mai bun. Randamentul e deja net.</p>
        </div>
        <div className="h-80">
          {ready ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart}
                layout="vertical"
                margin={{ top: 4, right: 28, left: 0, bottom: 4 }}
                barGap={2}
                barCategoryGap={14}
              >
                <CartesianGrid horizontal={false} stroke="var(--color-line)" />
                <XAxis
                  type="number"
                  tick={{ fill: "var(--color-muted)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  interval={0}
                  tick={{ fill: "var(--color-ink)", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-paper)" }}
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-line)",
                    borderRadius: 12,
                    fontSize: 13,
                  }}
                />
                <Bar dataKey="riy" name="RIY %/an" fill="var(--color-brass)" radius={4} />
                <Bar dataKey="randament" name="Moderat %/an" fill="var(--color-pine)" radius={4} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-xl bg-paper" />
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-brass" aria-hidden="true" />
            RIY %/an
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-pine" aria-hidden="true" />
            Scenariu moderat %/an
          </span>
        </div>
      </div>

      <ol className="space-y-3">
        {rows.map((row, index) => (
          <li key={row.product.id}>
            <article className="rounded-xl border border-line bg-card p-4">
              <button
                type="button"
                onClick={() => onOpen(row.product.id)}
                className="flex w-full items-start gap-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold tracking-wide text-brass uppercase">
                    {row.eligible ? `Loc ${index + 1}` : "Peste toleranța de risc"} · SRI {sriLabel(row.product)}
                  </p>
                  <h3 className="mt-1 text-lg break-words">
                    {row.product.insurer}
                    <span className="font-sans text-base font-normal text-muted"> · {row.product.name}</span>
                  </h3>
                </div>
                <p className="shrink-0 text-2xl text-pine tabular-nums">{row.score}</p>
              </button>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <Stat label="RIY / an" value={range(row.product.riyMin, row.product.riyMax)} />
                <Stat label="Intrare" value={`${fmt(row.product.frontLoadPct)}%`} />
                <Stat
                  label="Moderat"
                  value={range(row.product.moderateMin, row.product.moderateMax, "%/an")}
                />
                <Stat label="Deținere" value={`${row.product.rhpYears} ani`} />
              </dl>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
                <Meter label="Cost" value={row.parts.cost} />
                <Meter label="Comision" value={row.parts.commission} />
                <Meter label="Randament" value={row.parts.returns} />
                <Meter label="Potrivire" value={row.parts.fit} />
                <Meter label="Acoperiri" value={row.parts.cover} />
              </div>
              {openId === row.product.id && (
                <div className="mt-4 space-y-2 border-t border-line pt-3 text-sm leading-6">
                  {row.reasons.map((reason) => (
                    <p key={reason}>{reason}</p>
                  ))}
                  {row.warnings.map((warning) => (
                    <p key={warning} className="flex gap-2 text-risk">
                      <AlertTriangle className="mt-1 size-4 shrink-0" aria-hidden="true" />
                      {warning}
                    </p>
                  ))}
                  <p className="text-muted">{row.product.entryNote}</p>
                  <p className="text-muted">{row.product.ongoingNote}</p>
                  <p className="text-muted">{row.product.earlyExitNote}</p>
                  <p className="text-muted">{row.product.caveat}</p>
                  <p className="text-xs text-muted">
                    Exemplu KID: {row.product.exampleLabel}. Profil folosit: orizont {profile.horizon} ani, SRI max {profile.maxSri}.
                  </p>
                  <a
                    href={row.product.kidUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center font-semibold text-pine"
                  >
                    Deschide KID-ul public
                  </a>
                </div>
              )}
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-paper px-3 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-semibold break-words tabular-nums">{value}</dd>
    </div>
  );
}

function Meter({ label, value }: { label: string; value: number | null }) {
  const width = value == null ? 0 : value;
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted" title={label}>
        {label}
      </p>
      <p className="text-sm font-semibold tabular-nums">{value == null ? "—" : value}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-paper">
        <div className="h-full bg-pine" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function Documents() {
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [excerpt, setExcerpt] = useState<{ id: string; text: string } | null>(null);
  const [extracting, setExtracting] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const result = await scanMarket({ data: { includePdfs: true } });
      setScan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scanarea a eșuat.");
    } finally {
      setScanning(false);
    }
  }

  async function runExtract(product: Product) {
    setExtracting(product.id);
    setError(null);
    try {
      const result = await extractKid({ data: { url: product.kidUrl } });
      setExcerpt({
        id: product.id,
        text: result.mentionsCost
          ? result.excerpt
          : "PDF-ul s-a descărcat, dar secțiunea de costuri nu a fost găsită în textul extras.",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extragerea a eșuat.");
    } finally {
      setExtracting(null);
    }
  }

  const hitFor = (id: string) => scan?.documents.find((doc) => doc.id === id)?.hit;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card p-4">
        <div className="min-w-0">
          <h2 className="text-xl">KID-uri unit-linked</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Fișa folosește extrase verificate din PDF-urile publice. Scanarea controlează dacă
            documentele răspund și caută linkuri noi pe paginile asigurătorilor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runScan()}
          disabled={scanning}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-pine px-4 text-sm font-semibold text-card disabled:opacity-60"
        >
          {scanning ? <RefreshCw className="size-4 animate-spin" /> : <ScanSearch className="size-4" />}
          {scanning ? "Scanează…" : "Scanează sursele"}
        </button>
      </div>
      {error && (
        <p className="rounded-xl bg-risk-soft px-4 py-3 text-sm text-risk">{error}</p>
      )}
      <ul className="space-y-3">
        {PRODUCTS.map((product) => {
          const hit = hitFor(product.id);
          return (
            <li key={product.id} className="rounded-xl border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg break-words">{product.name}</h3>
                  <p className="text-sm text-muted">
                    {product.insurer} · KID {product.kidDate} · {product.currency} ·{" "}
                    {product.premiumMode === "unica" ? "primă unică" : "primă eșalonată"}
                  </p>
                </div>
                <Status hit={hit} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={product.kidUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center rounded-full border border-line px-4 text-sm font-semibold"
                >
                  PDF original
                </a>
                <button
                  type="button"
                  onClick={() => void runExtract(product)}
                  disabled={extracting === product.id}
                  className="inline-flex h-11 items-center rounded-full bg-paper px-4 text-sm font-semibold disabled:opacity-60"
                >
                  {extracting === product.id ? "Extrage…" : "Extrage textul de costuri"}
                </button>
              </div>
              {excerpt?.id === product.id && (
                <p className="mt-3 rounded-lg bg-paper p-3 text-sm leading-6 break-words text-ink">{excerpt.text}</p>
              )}
            </li>
          );
        })}
      </ul>
      {scan && (
        <div className="rounded-xl border border-line bg-card p-4">
          <h3 className="text-lg">Linkuri găsite pe pagini</h3>
          <p className="mt-1 text-xs text-muted">
            Verificat {new Date(scan.checkedAt).toLocaleString("ro-RO")}.
          </p>
          {scan.pageErrors.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-risk">
              {scan.pageErrors.map((item) => (
                <li key={item.url}>
                  {item.insurer}: {item.error}
                </li>
              ))}
            </ul>
          )}
          {scan.discovered.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              Niciun PDF nou în paginile verificate. Multe site-uri țin lista de KID-uri în spatele unui meniu dinamic.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {scan.discovered.map((link) => (
                <li key={link.href} className="border-t border-line pt-2">
                  <a href={link.href} target="_blank" rel="noreferrer" className="font-semibold break-words text-pine">
                    {link.text}
                  </a>
                  <p className="text-xs text-muted">
                    {link.insurer}
                    {link.known ? " · deja în fișă" : " · negăsit în scor, de verificat manual"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

function Status({ hit }: { hit?: { ok: boolean; bytes: number | null; error?: string } }) {
  if (!hit) return <span className="text-xs text-muted">Neverificat live</span>;
  if (hit.ok) {
    return (
      <span className="rounded-full bg-brass-soft px-3 py-1 text-xs font-semibold text-brass">
        PDF activ{hit.bytes ? ` · ${Math.round(hit.bytes / 1024)} KB` : ""}
      </span>
    );
  }
  return (
    <span className="max-w-full rounded-full bg-risk-soft px-3 py-1 text-xs font-semibold break-words text-risk">
      {hit.error ?? "Indisponibil"}
    </span>
  );
}

function ReportPanel({ profile, ranked }: { profile: Profile; ranked: RankedProduct[] }) {
  const markdown = useMemo(() => buildReport(profile, ranked), [profile, ranked]);
  const [drive, setDrive] = useState<DriveState | null>(null);
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const result = await syncDriveFolder({ data: { create: true } });
      setDrive(result);
      if (result.loginRequired) {
        redirectToLoginIfRequired({
          ok: false,
          data: null,
          loginRequired: true,
          loginUrl: result.loginUrl,
          errorMessage: result.error,
        });
      }
    } finally {
      setBusy(false);
    }
  }

  const waiting = drive?.pending === true;
  const waitStatus = useRefetchWhenConnectorReady(waiting, () => {
    void sync();
  });

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "raport-atlas-kid.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const top = ranked.filter((row) => row.eligible).slice(0, 3);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-line bg-pine-deep p-5 text-card">
        <div className="flex items-center gap-2 text-brass-soft">
          <Shield className="size-4 shrink-0" aria-hidden="true" />
          <p className="text-xs font-semibold tracking-widest text-brass-soft uppercase">Raport de potrivire</p>
        </div>
        <h2 className="mt-2 text-2xl text-card">
          {top[0]
            ? `${top[0].product.insurer} conduce pentru profilul acesta`
            : "Niciun produs nu rămâne în toleranța de risc"}
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-brass-soft">
          Atractivitatea înseamnă RIY mic la perioada recomandată, comision de intrare mic,
          scenariu moderat mai bun și acoperirile cerute. Scorul se schimbă când schimbați
          chestionarul.
        </p>
      </div>

      <ol className="space-y-3">
        {top.map((row, index) => (
          <li key={row.product.id} className="rounded-xl border border-line bg-card p-4">
            <p className="text-xs font-semibold text-brass">Recomandarea {index + 1}</p>
            <h3 className="text-xl break-words">
              {row.product.insurer} · {row.product.name}
            </h3>
            <ul className="mt-2 space-y-1 text-sm leading-6">
              {row.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="no-print rounded-xl border border-line bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg">Google Drive</h3>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Creează sau deschide folderul „{DRIVE_FOLDER_NAME}” și listează PDF-urile deja puse
              acolo. Conectorul aplicației poate crea foldere și citi fișiere, nu încărca PDF-uri
              noi din browser — pachetul de KID-uri se pune în folder din sesiunea Grok.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void sync()}
            disabled={busy}
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-pine px-4 text-sm font-semibold text-card disabled:opacity-60"
          >
            <FolderOpen className="size-4" />
            {busy ? "Se leagă…" : "Deschide folderul"}
          </button>
        </div>
        {drive?.loginRequired && (
          <p className="mt-3 text-sm">
            Continuă cu Grok ca să autorizăm Drive.
            {drive.loginUrl && (
              <button
                type="button"
                className="ml-2 font-semibold text-pine"
                onClick={() =>
                  redirectToLoginIfRequired({
                    ok: false,
                    data: null,
                    loginRequired: true,
                    loginUrl: drive.loginUrl,
                  })
                }
              >
                Autentificare
              </button>
            )}
          </p>
        )}
        {waiting && (
          <p className="mt-3 text-sm text-muted">
            {waitStatus === "not_embedded"
              ? "Previzualizarea locală nu primește încă cheia Drive. Deschide aplicația din Grok."
              : "Aștept conexiunea la Drive…"}
          </p>
        )}
        {drive?.error && !drive.pending && !drive.loginRequired && (
          <p className="mt-3 text-sm text-risk">{drive.error}</p>
        )}
        {drive?.ok && (
          <div className="mt-4">
            <p className="text-sm">
              {drive.created ? "Folder nou creat." : "Folder găsit."}{" "}
              {drive.folderLink && (
                <a href={drive.folderLink} target="_blank" rel="noreferrer" className="font-semibold text-pine">
                  Deschide în Drive
                </a>
              )}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {(drive.files ?? []).length === 0 && (
                <li className="text-muted">Folderul este gol momentan.</li>
              )}
              {(drive.files ?? []).map((file) => (
                <li key={file.id} className="break-words">
                  {file.link ? (
                    <a href={file.link} target="_blank" rel="noreferrer" className="text-pine">
                      {file.name}
                    </a>
                  ) : (
                    file.name
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          onClick={download}
          className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold"
        >
          <Download className="size-4" />
          Descarcă raportul
        </button>
      </div>

      <article className="rounded-xl border border-line bg-card p-4 text-sm leading-6">
        <h3 className="text-lg">Metodă</h3>
        <p className="mt-2 text-muted">
          Fiecare produs primește note pentru RIY la perioada din KID, pentru partea din primele
          de început care nu se investește, pentru scenariul moderat după costuri, pentru
          distanța dintre orizontul dumneavoastră și perioada recomandată, și pentru acoperirile
          bifate. La un orizont de 5 ani, costul din primul an cântărește mai greu decât RIY-ul
          la scadență. Produsele fără scenariu public nu sunt inventate: randamentul iese din
          scor. Un SRI minim peste toleranță scoate produsul din lista potrivită.
        </p>
        <p className="mt-2 text-muted">
          Cifrele vin din documentele cu informații esențiale publicate de asigurători, nu din
          oferte personalizate. Vârsta, suma asigurată și fondul ales schimbă prima de risc și
          uneori clasa SRI. Cereți KID-ul ediției curente înainte de semnare.
        </p>
      </article>
    </section>
  );
}
