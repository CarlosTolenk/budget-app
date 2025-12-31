export type Bucket = "NEEDS" | "WANTS" | "SAVINGS";

export const bucketOrder: Bucket[] = ["NEEDS", "WANTS", "SAVINGS"];

export const bucketCopy: Record<Bucket, { label: string; description: string; targetRatio: number }> = {
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
