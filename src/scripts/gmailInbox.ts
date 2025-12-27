import dotenv from "dotenv";
import { google } from "googleapis";

import { createOAuthClient } from "../auth/googleOAuth";

dotenv.config();

async function listInbox() {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  if (!refreshToken) {
    throw new Error("GOOGLE_REFRESH_TOKEN no está definido. Ejecuta primero `npm run auth:gmail`.");
  }

  const oAuth2Client = createOAuthClient();
  oAuth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: "v1", auth: oAuth2Client });
  const messagesResponse = await gmail.users.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: 5,
  });

  const messages = messagesResponse.data.messages ?? [];
  if (messages.length === 0) {
    console.log("No se encontraron correos en INBOX.");
    return;
  }

  console.log(`Últimos ${messages.length} correos:`);

  for (const message of messages) {
    if (!message.id) continue;

    const { data } = await gmail.users.messages.get({
      userId: "me",
      id: message.id,
      format: "metadata",
      metadataHeaders: ["Subject", "From", "Date"],
    });

    const headers = Object.fromEntries((data.payload?.headers ?? []).map((item) => [item.name, item.value]));
    console.log(
      `- ${headers.Date ?? "sin fecha"} | ${headers.From ?? "sin remitente"} | ${
        headers.Subject ?? "sin asunto"
      } (id: ${message.id})`,
    );
  }
}

listInbox().catch((error) => {
  console.error("Error leyendo Gmail:", error);
  process.exit(1);
});
