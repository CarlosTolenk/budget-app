export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  snippet?: string;
  body: string;
  from: EmailAddress;
  to: EmailAddress[];
  receivedAt: Date;
  labels: string[];
  metadata?: Record<string, string>;
}
