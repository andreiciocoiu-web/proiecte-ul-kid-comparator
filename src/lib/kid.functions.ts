import { createServerFn } from "@tanstack/react-start";
import { PRODUCTS, SCAN_PAGES } from "@/data/catalog";

const ALLOWED_HOSTS = new Set([
  "www.nn.ro",
  "nn.ro",
  "www.groupama.ro",
  "groupama.ro",
  "www.allianztiriac.ro",
  "allianztiriac.ro",
  "bcr-adv-content-docs.s3.eu-central-1.amazonaws.com",
  "www.raiffeisen.ro",
  "raiffeisen.ro",
  "www.metropolitanlife.ro",
  "metropolitanlife.ro",
  "www.grawe.ro",
  "grawe.ro",
  "www.bcrasigviata.ro",
  "bcrasigviata.ro",
  "www.uniqa.ro",
  "uniqa.ro",
]);

const MAX_BYTES = 8_000_000;

export type ScanHit = {
  url: string;
  ok: boolean;
  status: number;
  bytes: number | null;
  isPdf: boolean;
  error?: string;
};

export type DiscoveredLink = {
  insurer: string;
  page: string;
  href: string;
  text: string;
  known: boolean;
};

export type ScanResult = {
  checkedAt: string;
  documents: { id: string; hit: ScanHit }[];
  discovered: DiscoveredLink[];
  pageErrors: { insurer: string; url: string; error: string }[];
};

function assertAllowed(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Adresă invalidă.");
  }
  if (url.protocol !== "https:") throw new Error("Sunt permise doar adrese https.");
  if (!ALLOWED_HOSTS.has(url.hostname)) throw new Error("Sursă din afara listei de asigurători.");
  return url;
}

async function fetchPublic(url: URL, timeoutMs: number): Promise<Response> {
  const response = await fetch(url, {
    redirect: "follow",
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      "user-agent": "AtlasKID/1.0 (comparatie KID unit-linked; +https://www.asfromania.ro)",
      accept: "text/html,application/pdf,*/*",
    },
  });
  const finalHost = new URL(response.url).hostname;
  if (!ALLOWED_HOSTS.has(finalHost)) {
    throw new Error("Redirecționare în afara listei de asigurători.");
  }
  return response;
}

async function probePdf(raw: string): Promise<ScanHit> {
  try {
    const url = assertAllowed(raw);
    const response = await fetchPublic(url, 18_000);
    const buffer = new Uint8Array(await response.arrayBuffer());
    const head = new TextDecoder().decode(buffer.slice(0, 5));
    return {
      url: raw,
      ok: response.ok && head === "%PDF-",
      status: response.status,
      bytes: buffer.byteLength,
      isPdf: head === "%PDF-",
      error: response.ok ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      url: raw,
      ok: false,
      status: 0,
      bytes: null,
      isPdf: false,
      error: error instanceof Error ? error.message : "Eroare de rețea",
    };
  }
}

function extractAnchors(html: string, base: URL): { href: string; text: string }[] {
  const out: { href: string; text: string }[] = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const hrefRaw = match[1];
    const text = match[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    if (!/\.pdf(\?|$)/i.test(hrefRaw)) continue;
    if (!/kid|informat|esential|esențial|priip|unit|invest/i.test(`${hrefRaw} ${text}`)) continue;
    try {
      const href = new URL(hrefRaw, base).toString();
      out.push({ href, text: text.slice(0, 140) || "PDF" });
    } catch {
      /* skip malformed */
    }
  }
  return out;
}

export const scanMarket = createServerFn({ method: "POST" })
  .validator((input: { includePdfs?: boolean } | undefined) => ({
    includePdfs: input?.includePdfs !== false,
  }))
  .handler(async ({ data }): Promise<ScanResult> => {
    const known = new Set(PRODUCTS.map((p) => p.kidUrl));
    const documents = data.includePdfs
      ? await Promise.all(
          PRODUCTS.map(async (product) => ({
            id: product.id,
            hit: await probePdf(product.kidUrl),
          })),
        )
      : [];

    const discovered: DiscoveredLink[] = [];
    const pageErrors: ScanResult["pageErrors"] = [];
    await Promise.all(
      SCAN_PAGES.map(async (page) => {
        try {
          const url = assertAllowed(page.url);
          const response = await fetchPublic(url, 14_000);
          if (!response.ok) {
            pageErrors.push({
              insurer: page.insurer,
              url: page.url,
              error: `HTTP ${response.status}`,
            });
            return;
          }
          const html = (await response.text()).slice(0, 1_500_000);
          const links = extractAnchors(html, new URL(response.url));
          for (const link of links.slice(0, 30)) {
            if (discovered.some((d) => d.href === link.href)) continue;
            discovered.push({
              insurer: page.insurer,
              page: page.url,
              href: link.href,
              text: link.text,
              known: known.has(link.href),
            });
          }
        } catch (error) {
          pageErrors.push({
            insurer: page.insurer,
            url: page.url,
            error: error instanceof Error ? error.message : "Eroare",
          });
        }
      }),
    );

    return {
      checkedAt: new Date().toISOString(),
      documents,
      discovered,
      pageErrors,
    };
  });

export const extractKid = createServerFn({ method: "POST" })
  .validator((input: { url?: string }) => {
    if (!input?.url || typeof input.url !== "string") throw new Error("Lipsește adresa KID.");
    assertAllowed(input.url);
    return { url: input.url };
  })
  .handler(async ({ data }) => {
    const url = assertAllowed(data.url);
    const response = await fetchPublic(url, 20_000);
    if (!response.ok) throw new Error(`Document indisponibil (HTTP ${response.status}).`);
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_BYTES) throw new Error("PDF-ul depășește limita de 8 MB.");
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-") {
      throw new Error("Răspunsul nu este un PDF.");
    }
    const { extractText } = await import("unpdf");
    const extracted = await extractText(bytes, { mergePages: true });
    const text = Array.isArray(extracted.text) ? extracted.text.join("\n") : String(extracted.text);
    const folded = text.replace(/\s+/g, " ").trim();
    const at = folded.toLowerCase().search(/care sunt costurile|costuri totale|impactul anual/);
    const excerpt =
      at >= 0 ? folded.slice(Math.max(0, at - 80), at + 900) : folded.slice(0, 900);
    return {
      bytes: bytes.byteLength,
      mentionsCost: at >= 0,
      excerpt,
    };
  });
