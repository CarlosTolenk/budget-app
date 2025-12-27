# Deploy a Presupuesto en Vercel

Esta guía resume los pasos necesarios para publicar el proyecto en Vercel y dejar automatizada la ingesta de correos de Gmail.

## 1. Requisitos previos
- Cuenta en Google Cloud con la **Gmail API** habilitada.
- OAuth Client ID tipo **Web** con `http://localhost:3000/oauth2callback` como redirect URI.
- Cuenta en Vercel con acceso al repositorio de este proyecto (GitHub/GitLab/Bitbucket).

## 2. Preparar variables y refresh token
1. Copia `.env.example` a `.env` y completa:
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_LABEL`
2. Ejecuta `npm install` (una sola vez).
3. Corre `npm run auth:gmail` (asegúrate de que no esté corriendo `npm run dev`). El script abre un servidor en `http://localhost:3000`, imprime la URL de consentimiento y, tras autorizar en Gmail, guarda el refresh token en `GOOGLE_REFRESH_TOKEN` **y** `GMAIL_REFRESH_TOKEN`.
   - El refresh token sólo se obtiene la primera vez o después de revocar el acceso desde [Google Account → Security → Third-party access](https://myaccount.google.com/permissions).
   - No hace falta renovar el refresh token periódicamente; la librería `googleapis` usa ese valor para generar access tokens nuevos de forma transparente.
4. Verifica que `GMAIL_LABEL` coincida con la etiqueta real de Gmail (ej: `GastosBanco`). El cron `/api/cron/import-emails` filtrará por ese nombre.

## 3. Crear el proyecto en Vercel
1. En Vercel, crea un **New Project** apuntando al repositorio.
2. Configura las variables de entorno en “Settings → Environment Variables”:
   - `DATABASE_URL` y `DIRECT_URL` (usa Postgres si pasas a producción, o deja SQLite para pruebas internas).
   - `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, `GMAIL_REFRESH_TOKEN`, `GMAIL_LABEL`.
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD` para habilitar el login básico (`/login`). Estos mismos valores se usan localmente.
   - Si necesitas reconstruir el refresh token en el futuro, repite el paso 2 y actualiza estos valores aquí.
3. El deploy inicial correrá `next build` y `prisma generate` automáticamente.

## 4. Cron jobs en Vercel
Desde “Settings → Cron Jobs” agrega:
- `GET /api/cron/import-emails` (cada hora o la frecuencia que prefieras) para ingerir correos.
- `GET /api/cron/process-scheduled` (recom. diario) para ejecutar transacciones programadas.

## 5. Consideraciones finales
- No se necesita un cron para refrescar el token: `gmail-provider` gestiona los access tokens usando el refresh token almacenado.
- Si cambias la contraseña de Gmail o ves errores `invalid_grant`, revoca el acceso en Google Account, vuelve a correr `npm run auth:gmail` y actualiza las variables en Vercel.
- Usa `npm run gmail:inbox` desde local para validar que el refresh token sigue siendo válido antes de subirlo a producción.
