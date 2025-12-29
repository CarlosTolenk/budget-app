import assert from "node:assert/strict";

import { QikAdapter } from "./qik-adapter";
import { EmailMessage } from "../types/email-message";

const adapter = new QikAdapter();

run();

function run() {
  shouldParseHtmlLayout();
  shouldParsePlainTextLayout();
  console.log("QikAdapter tests passed");
}

function shouldParseHtmlLayout() {
  const htmlBody = `
    <html>
      <head>
        <style>.dummy{color:red}</style>
      </head>
      <body>
        <p>Se hizo una transacción de <b>RD$ 1,362.95</b> en <strong>APPLE.COM/BILL</strong> con tu tarjeta crédito Qik que termina en <strong>53*************6313</strong></p>
        <table>
          <tr><td>Localidad</td><td>APPLE.COM/BILL</td></tr>
          <tr><td>Fecha y hora</td><td>28/12/2025 02:30 PM (AST)</td></tr>
          <tr><td>Monto</td><td>RD$ 1,362.95</td></tr>
        </table>
      </body>
    </html>
  `;

  const message = createMessage({
    id: "html-format",
    body: htmlBody,
    subject: "Usaste tu tarjeta de crédito Qik",
    snippet: "Se hizo una transacción de RD$ 1,362.95 en APPLE.COM/BILL",
    receivedAt: new Date("2025-12-28T18:30:00.000Z"),
  });

  const parsed = adapter.parse(message);
  assert.ok(parsed, "Expected the HTML Qik format to be parsed");
  assert.equal(parsed.amount, 1362.95);
  assert.equal(parsed.currency, "DOP");
  assert.equal(parsed.merchant, "APPLE.COM/BILL");
  assertDateParts(parsed.date, { year: 2025, month: 12, day: 28, hours: 14, minutes: 30 });
}

function shouldParsePlainTextLayout() {
  const plainTextBody = `
¡Hola CARLOS MANUEL TOLENTINO ESPINAL!
Tarjeta  53*************6313

Se hizo una transacción de *RD$ 126.36* en *GOOGLE*FXS 107542* con tu tarjeta crédito Qik que termina en *53*************6313*

Localidad *GOOGLE*FXS 107542*
Fecha y hora *12-24-2025 08:25 AM (AST)*
Monto *RD$ 126.36*
Balance Disponible *RD$ 123,577.85*
`;

  const message = createMessage({
    id: "plain-text-format",
    body: plainTextBody,
    subject: "Fwd: Usaste tu tarjeta de crédito Qik",
    snippet: "Se hizo una transacción de RD$ 126.36 en GOOGLE*FXS 107542",
  });

  const parsed = adapter.parse(message);
  assert.ok(parsed, "Expected the plain text Qik format to be parsed");
  assert.equal(parsed.amount, 126.36);
  assert.equal(parsed.currency, "DOP");
  assert.equal(parsed.merchant, "GOOGLE FXS 107542");
  assert.equal(parsed.bucket, "WANTS");
  assertDateParts(parsed.date, { year: 2025, month: 12, day: 24, hours: 8, minutes: 25 });
}

function createMessage(overrides: Partial<EmailMessage>): EmailMessage {
  const base: EmailMessage = {
    id: "base-id",
    subject: "Qik notification",
    body: "",
    from: { email: "notificaciones@qik.do", name: "Qik" },
    to: [{ email: "user@example.com" }],
    receivedAt: new Date("2025-12-20T00:00:00.000Z"),
    labels: ["INBOX"],
    snippet: "",
  };

  return { ...base, ...overrides };
}

function assertDateParts(
  date: Date,
  parts: { year: number; month: number; day: number; hours: number; minutes: number },
) {
  assert.equal(date.getFullYear(), parts.year);
  assert.equal(date.getMonth() + 1, parts.month);
  assert.equal(date.getDate(), parts.day);
  assert.equal(date.getHours(), parts.hours);
  assert.equal(date.getMinutes(), parts.minutes);
}
