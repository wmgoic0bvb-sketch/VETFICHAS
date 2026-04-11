const SHEET_ID = process.env.MEDICAMENTOS_SHEET_ID ?? "";
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;
const TTL_MS = 60 * 60 * 1000;
const NAME_COLUMN_INDEX = 1;
const MIN_NAME_LENGTH = 3;

type Cache = { at: number; names: string[]; normalized: string[] };
let cache: Cache | null = null;
let inflight: Promise<Cache> | null = null;

export function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (inQuotes) {
      if (ch === '"') {
        if (csv[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && csv[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function extractNames(rows: string[][]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const raw = rows[i]?.[NAME_COLUMN_INDEX];
    if (typeof raw !== "string") continue;
    const name = raw.trim().replace(/\s+/g, " ");
    if (name.length < MIN_NAME_LENGTH) continue;
    if (!/[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(name)) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  out.sort((a, b) => a.localeCompare(b, "es"));
  return out;
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

async function loadFresh(): Promise<Cache> {
  if (!SHEET_ID) throw new Error("MEDICAMENTOS_SHEET_ID no configurado");
  const res = await fetch(CSV_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
  const csv = await res.text();
  const names = extractNames(parseCsvRows(csv));
  return { at: Date.now(), names, normalized: names.map(normalize) };
}

async function getCache(): Promise<Cache> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache;
  if (inflight) return inflight;
  inflight = loadFresh()
    .then((fresh) => {
      cache = fresh;
      return fresh;
    })
    .finally(() => {
      inflight = null;
    });
  try {
    return await inflight;
  } catch (err) {
    if (cache) return cache;
    throw err;
  }
}

export function searchIn(
  names: string[],
  normalized: string[],
  query: string,
  limit: number,
): string[] {
  const q = normalize(query);
  if (!q) return [];
  const prefix: string[] = [];
  const contains: string[] = [];
  for (let i = 0; i < normalized.length; i++) {
    const n = normalized[i];
    if (n.startsWith(q)) prefix.push(names[i]);
    else if (n.includes(q)) contains.push(names[i]);
    if (prefix.length >= limit) break;
  }
  return [...prefix, ...contains].slice(0, limit);
}

export async function searchMedicamentos(
  query: string,
  limit = 10,
): Promise<string[]> {
  const c = await getCache();
  return searchIn(c.names, c.normalized, query, limit);
}

export function __resetCacheForTests(): void {
  cache = null;
  inflight = null;
}
