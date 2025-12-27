import { Bucket } from "@/domain/value-objects/bucket";

const NEEDS_REGEX = /SUPER|MERCAD|GROCERY|ESTACION DE COMBUSTIBL|GASOLINA/;
const WANTS_REGEX = /RESTAURANT|BAR|FOOD|CAF|DELI|GOOGLE|PAYPAL|LEIDSA|ANIMED/;

export function detectMerchantBucket(merchant: string): Bucket {
  const upperMerchant = merchant.toUpperCase();
  if (NEEDS_REGEX.test(upperMerchant)) {
    return "NEEDS";
  }
  if (WANTS_REGEX.test(upperMerchant)) {
    return "WANTS";
  }
  return "NEEDS";
}
