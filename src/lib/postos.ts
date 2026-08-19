import { CIVIL_POSTO_GRAD } from "@/lib/civil";

/** Hierarquia FAB (maior → menor), com abreviações vistas no efetivo HARF. */
const POSTO_RANK: Array<{ rank: number; aliases: string[] }> = [
  { rank: 10, aliases: ["CL", "CEL", "CORONEL"] },
  { rank: 20, aliases: ["TC", "TEN CEL", "TEN-CEL", "TENENTE CORONEL"] },
  { rank: 30, aliases: ["MJ", "MAJ", "MAJOR"] },
  { rank: 40, aliases: ["CP", "CAP", "CAPITAO"] },
  { rank: 50, aliases: ["1T", "1 T", "1 TEN", "1TEN"] },
  { rank: 60, aliases: ["2T", "2 T", "2 TEN", "2TEN"] },
  { rank: 70, aliases: ["ASP", "ASPIRANTE"] },
  { rank: 80, aliases: ["SO", "SUBOF", "SUBOFICIAL"] },
  { rank: 90, aliases: ["1S", "1 S"] },
  { rank: 100, aliases: ["2S", "2 S"] },
  { rank: 110, aliases: ["3S", "3 S"] },
  { rank: 120, aliases: ["CB", "CABO"] },
  { rank: 130, aliases: ["S1"] },
  { rank: 140, aliases: ["S2"] },
  { rank: 150, aliases: ["SD", "SOLDADO"] },
];

const RANK_BY_KEY = new Map<string, number>();
for (const { rank, aliases } of POSTO_RANK) {
  for (const alias of aliases) {
    RANK_BY_KEY.set(normalizePostoKey(alias), rank);
  }
}

const CIVIL_RANK = 900;
const EMPTY_RANK = 950;
const UNKNOWN_RANK = 500;

export function normalizePostoKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/** Planilha “Civil” e cadastro “Servidor Civil” são o mesmo tipo. */
export function isCivilEmployeePosto(posto: string): boolean {
  const key = normalizePostoKey(posto);
  return key === "CIVIL" || key === normalizePostoKey(CIVIL_POSTO_GRAD);
}

export function canonicalPostoGrad(posto: string): string {
  const trimmed = posto.trim();
  if (!trimmed) return "";
  if (isCivilEmployeePosto(trimmed)) return CIVIL_POSTO_GRAD;
  return trimmed;
}

export function formatPostoLabel(posto: string): string {
  return canonicalPostoGrad(posto) || posto;
}

function postoSortRank(posto: string): number {
  if (!posto.trim()) return EMPTY_RANK;
  if (isCivilEmployeePosto(posto)) return CIVIL_RANK;
  return RANK_BY_KEY.get(normalizePostoKey(posto)) ?? UNKNOWN_RANK;
}

export function comparePostoGrad(a: string, b: string): number {
  const rankDiff = postoSortRank(a) - postoSortRank(b);
  if (rankDiff !== 0) return rankDiff;
  return canonicalPostoGrad(a).localeCompare(canonicalPostoGrad(b), "pt-BR", {
    sensitivity: "base",
  });
}

export function sortPostos(postos: string[]): string[] {
  const unique = [
    ...new Set(postos.map(canonicalPostoGrad).filter((p) => p.length > 0)),
  ];
  return unique.sort(comparePostoGrad);
}
