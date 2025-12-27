import { EmailMessage } from "../types/email-message";
import { CreateTransactionInput } from "@/domain/transactions/transaction";

export interface BankAdapter {
  readonly name: string;
  matches(message: EmailMessage): boolean;
  parse(message: EmailMessage): Omit<CreateTransactionInput, "id"> | null;
}
