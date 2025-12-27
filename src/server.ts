import express from "express";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import type { Server } from "node:http";

import { createOAuthClient, generateAuthUrl } from "./auth/googleOAuth";

dotenv.config();

const PORT = 3000;

function persistEnvValue(key: string, value: string): void {
  const envPath = path.resolve(process.cwd(), ".env");
  const line = `${key}="${value}"`;

  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }

  const regex = new RegExp(`^${key}=.*$`, "m");
  if (regex.test(content)) {
    content = content.replace(regex, line);
  } else {
    content = content.length > 0 ? `${content.trimEnd()}\n${line}\n` : `${line}\n`;
  }

  fs.writeFileSync(envPath, content);
}

async function bootstrap() {
  const app = express();
  let server: Server | null = null;
  const oAuth2Client = createOAuthClient();
  const authUrl = generateAuthUrl(oAuth2Client);

  console.log("⚠️  Asegúrate de que no haya otro proceso usando http://localhost:3000 antes de continuar.\n");
  console.log("1) Abre la siguiente URL en el navegador y autoriza el acceso a Gmail:\n");
  console.log(authUrl);
  console.log(
    "\n2) Tras aceptar, Google redirigirá a http://localhost:3000/oauth2callback y este script intercambiará el code automáticamente.\n",
  );

  app.get("/", (_, res) => {
    res.send(
      `<p>Este servidor solo maneja el flujo OAuth. Usa la URL impresa en consola para autorizar Gmail.</p><p>Al terminar puedes cerrar esta ventana.</p>`,
    );
  });

  app.get("/oauth2callback", async (req, res) => {
    const code = req.query.code as string | undefined;
    if (!code) {
      res.status(400).send("Falta el parámetro 'code'. Vuelve al navegador y acepta el consentimiento.");
      return;
    }

    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);

      if (tokens.refresh_token) {
        persistEnvValue("GOOGLE_REFRESH_TOKEN", tokens.refresh_token);
        persistEnvValue("GMAIL_REFRESH_TOKEN", tokens.refresh_token);
        console.log("\n✅ refresh_token recibido y guardado en .env como GOOGLE_REFRESH_TOKEN / GMAIL_REFRESH_TOKEN.");
      } else {
        console.log(
          "\n⚠️ Google no devolvió refresh_token. Ocurre si ya autorizaste antes sin 'prompt=consent' o si el proyecto no tiene access_type=offline.",
        );
        console.log("Revoca el acceso desde Google Account > Security > Third-party access y vuelve a intentar.");
      }

      console.log("Access Token (caduca rápido):", tokens.access_token ?? "no provisto");

      res.send("Tokens recibidos. Revisa la consola para más detalles. Ya puedes cerrar esta ventana.");

      server?.close(() => process.exit(0));
    } catch (error) {
      console.error("No se pudo intercambiar el code por tokens:", error);
      res
        .status(500)
        .send("Error al intercambiar tokens. Revisa la consola para más detalles y vuelve a intentarlo.");
    }
  });

  server = app.listen(PORT, () => {
    console.log(`\nServidor de OAuth escuchando en http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Error inicializando el servidor OAuth:", error);
  process.exit(1);
});
