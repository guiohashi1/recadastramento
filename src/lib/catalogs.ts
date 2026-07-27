import fs from "fs";
import path from "path";

export type CatalogOption = {
  /** AD group CN, e.g. harf-uti */
  value: string;
  /** UI label, e.g. UTI */
  label: string;
};

function dataPath(...parts: string[]) {
  return path.join(process.cwd(), "data", ...parts);
}

function readLines(fileName: string): string[] {
  const raw = fs.readFileSync(dataPath(fileName), "utf8");
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
}

/** harf-uti → UTI */
export function labelFromAdGroup(cn: string): string {
  const stripped = cn.replace(/^harf-/i, "");
  return stripped.replace(/_/g, " ").toUpperCase();
}

export function loadSetores(): CatalogOption[] {
  return readLines("setores.csv")
    .map((value) => ({ value, label: labelFromAdGroup(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

/**
 * Network folders selectable by users.
 * Excludes chefia groups (-ch) and blocked self-service groups.
 */
const PASTAS_BLOQUEADAS = new Set(["harf-efetivo"]);

export function loadPastasRede(options?: {
  excludeSetor?: string;
}): CatalogOption[] {
  const exclude = options?.excludeSetor;
  return readLines("grupos.csv")
    .filter((cn) => !cn.toLowerCase().endsWith("-ch"))
    .filter((cn) => !PASTAS_BLOQUEADAS.has(cn.toLowerCase()))
    .filter((cn) => (exclude ? cn !== exclude : true))
    .map((value) => ({ value, label: labelFromAdGroup(value) }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

export function isValidSetor(cn: string): boolean {
  return loadSetores().some((s) => s.value === cn);
}

export function isValidPasta(cn: string): boolean {
  return loadPastasRede().some((p) => p.value === cn);
}
