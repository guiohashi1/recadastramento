import type { PersonnelStatus } from "@prisma/client";

export const PERSONNEL_STATUS_LABELS: Record<PersonnelStatus, string> = {
  MILITAR_DA_ATIVA: "Militar da ativa",
  RESERVA_REMUNERADA: "Reserva remunerada",
  CIVIL: "Servidor civil",
};

export const PERSONNEL_STATUS_OPTIONS: {
  value: PersonnelStatus;
  label: string;
}[] = [
  { value: "MILITAR_DA_ATIVA", label: PERSONNEL_STATUS_LABELS.MILITAR_DA_ATIVA },
  {
    value: "RESERVA_REMUNERADA",
    label: PERSONNEL_STATUS_LABELS.RESERVA_REMUNERADA,
  },
  { value: "CIVIL", label: PERSONNEL_STATUS_LABELS.CIVIL },
];

/** Default status suggested from ODS sheet / perfil civil */
export function defaultStatusFromSheet(
  sheet: "ATIVA" | "PTTC" | "MANUAL",
  options?: { isCivil?: boolean },
): PersonnelStatus {
  if (options?.isCivil) return "CIVIL";
  if (sheet === "PTTC") return "RESERVA_REMUNERADA";
  if (sheet === "ATIVA") return "MILITAR_DA_ATIVA";
  return "MILITAR_DA_ATIVA";
}
