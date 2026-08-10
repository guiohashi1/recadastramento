import { z } from "zod";
import { isValidCpf, cpfDigits, formatCpf } from "@/lib/cpf";

export const civilCadastroSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe o nome completo")
    .max(120, "Nome muito longo"),
  cpf: z
    .string()
    .trim()
    .refine((v) => isValidCpf(v), "CPF inválido"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .max(120),
});

export type CivilCadastroValues = z.infer<typeof civilCadastroSchema>;

export { cpfDigits, formatCpf };
