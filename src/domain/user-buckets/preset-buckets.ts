import { PresetBucketKey } from "./user-bucket";

export const presetBucketOrder: PresetBucketKey[] = ["NEEDS", "WANTS", "SAVINGS"];

export const presetBucketCopy: Record<
  PresetBucketKey,
  { label: string; description: string; targetRatio: number }
> = {
  NEEDS: {
    label: "Necesarios",
    description: "Gastos básicos para vivir (50%)",
    targetRatio: 0.5,
  },
  WANTS: {
    label: "Prescindibles",
    description: "Gustos y estilo de vida (30%)",
    targetRatio: 0.3,
  },
  SAVINGS: {
    label: "Ahorro",
    description: "Metas, deudas y colchón (20%)",
    targetRatio: 0.2,
  },
};
