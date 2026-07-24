import { z } from "zod";
import type { PersonnelStatus } from "@prisma/client";

export const submissionFormSchema = z.object({
  status: z.enum([
    "MILITAR_DA_ATIVA",
    "RESERVA_REMUNERADA",
    "CIVIL",
  ] as const satisfies readonly PersonnelStatus[]),
  setorAd: z.string().min(1, "Selecione o setor principal"),
  pastasAd: z.array(z.string()).default([]),
  email: z.union([z.literal(""), z.string().email("E-mail inválido")]),
  telefone: z.string().max(40).optional(),
  identidade: z
    .string()
    .min(1, "Informe o CPF")
    .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido (use 000.000.000-00)"),
  confirmIdentity: z.literal(true, {
    errorMap: () => ({
      message: "Confirme que os dados de identificação estão corretos",
    }),
  }),
});

export type SubmissionFormValues = z.infer<typeof submissionFormSchema>;
