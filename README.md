# Presupuesto 50/30/20

Aplicación Next.js 14 orientada a un MVP escalable para controlar un presupuesto personal con la regla 50/30/20. La ingesta de gastos se hace leyendo emails bancarios (sin conectarse a APIs financieras) y está preparada para ejecutarse automáticamente con un cron job de Vercel.

## Stack
- Next.js 14 App Router + TypeScript
- Tailwind CSS v4 (clases utilitarias en `globals.css`)
- Prisma ORM + PostgreSQL (compatible con Vercel Postgres)
- Arquitectura inspirada en Clean Architecture / DDD-light
- Pipelines de ingesta de emails (EmailProvider + BankAdapter pattern)

## Primeros pasos
1. **Clonar e instalar dependencias**
   ```bash
   npm install
   ```
2. **Configurar variables de entorno**
   - El repositorio ya incluye una plantilla `.env` usando SQLite local:
     ```bash
     DATABASE_URL="file:./dev.db"
     DIRECT_URL="file:./dev.db"
     GMAIL_CLIENT_ID=
     GMAIL_CLIENT_SECRET=
     GMAIL_REFRESH_TOKEN=
     ```
   - Para moverte a PostgreSQL (Vercel Postgres u otro servicio) actualiza `prisma/schema.prisma` para que `provider = "postgresql"` y sustituye `DATABASE_URL`/`DIRECT_URL` por la cadena de conexión correspondiente.
   - Mientras no existan credenciales reales de Gmail, se usa un `MockEmailProvider`; los datos persisten en el archivo SQLite local.
3. **Ejecutar migraciones de Prisma**
   ```bash
   npm run prisma:migrate -- --name init
   npm run prisma:generate
   ```
   Esto crea las tablas `Transaction`, `Category`, `Budget`, `Rule` e `Income` (ver `prisma/migrations/0_init/migration.sql`).
4. **Levantar el entorno local**
   ```bash
   npm run dev
   ```
   El dashboard vive en [http://localhost:3000](http://localhost:3000) y usa casos de uso server-side.

## Scripts útiles
| Script | Descripción |
| --- | --- |
| `npm run dev` | Next.js en modo desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run lint` | Reglas Next + TypeScript |
| `npm run prisma:migrate` | Ejecuta migraciones contra la DB configurada (SQLite o Postgres) |
| `npm run prisma:generate` | Genera el cliente de Prisma (también se ejecuta en `postinstall`) |
| `npm run prisma:studio` | Abre Prisma Studio |

## Arquitectura
```
src/
 ├─ app/                  # App Router (UI server components + API routes)
 ├─ domain/               # Entidades + contratos de repositorios (regla del negocio)
 ├─ application/          # Casos de uso y DTOs reutilizables
 ├─ infrastructure/
 │   ├─ db/               # Prisma Client
 │   ├─ repositories/     # Implementaciones Prisma + memoria
 │   ├─ email/            # Adaptadores a Gmail (OAuth pending)
 │   └─ config/           # Environment validation + contenedor de dependencias
 └─ modules/email-ingestion
     ├─ providers/        # EmailProvider abstraction (Gmail + mocks)
     ├─ adapters/         # BankAdapter pattern para cada banco
     └─ services/         # EmailIngestionService orchestration
```

- **Separación de capas:** La UI solo consume casos de uso (`serverContainer`). No hay lógica de negocio dentro de los componentes React.
- **Repositorios duales:** Prisma para Postgres y versiones en memoria (seed en `memory-data.ts`) para demos o tests sin base de datos.
- **Email ingestion:** `EmailProvider` abstrae la fuente (Gmail OAuth). `BankAdapter` permite parsear distintos formatos por banco. `EmailIngestionService` maneja fetch → dedupe por `emailMessageId` → categorización por reglas → persiste como **borradores** que luego se aprueban manualmente.

## Cron `/api/cron/import-emails`
- Ruta serverless (`src/app/api/cron/import-emails/route.ts`) lista para conectarse a **Vercel Cron**.
- Responde `GET` y ejecuta `ProcessIncomingEmailsUseCase`, el cual orquesta `EmailIngestionService`.
- En Vercel, crea un cron job `GET https://<tu-app>.vercel.app/api/cron/import-emails` con la cadencia deseada (por ejemplo, `0 * * * *` para cada hora).

## Cron `/api/cron/process-scheduled`
- Revisa las transacciones programadas y crea transacciones reales cuando `nextRunDate <= hoy`.
- En Vercel crea un cron job diario (`0 5 * * *`) que haga `GET https://<tu-app>.vercel.app/api/cron/process-scheduled`.

## Cambiar de SQLite (dev) a PostgreSQL (prod)
1. Ajusta `.env` o las variables en Vercel:
   ```bash
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
   DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public"
   ```
2. Cambia el `provider` del datasource en `prisma/schema.prisma` a `"postgresql"`.
3. Borra la base de datos local (`rm dev.db`) y limpia las migraciones previas si estaban hechas para SQLite (`rm -rf prisma/migrations`).
4. Ejecuta `npx prisma migrate dev --name init` apuntando al Postgres real para generar una migración nueva compatible.
4. A partir de ahí, `npm run prisma:migrate` y `npm run prisma:generate` seguirán funcionando en ambos entornos.

## Despliegue en Vercel
1. Crear un nuevo proyecto apuntando al repo.
2. Configurar las mismas variables de entorno (`DATABASE_URL`, `DIRECT_URL`, `GMAIL_*`). Para Vercel Postgres, `DATABASE_URL` suele apuntar al string con pooling y `DIRECT_URL` al puerto directo (para migraciones). Además, recuerda cambiar el `provider` del datasource a `"postgresql"` antes del deploy.
3. Añadir el cron job desde **Vercel → Settings → Cron Jobs**.
4. Deploy (`main`) disparará `next build` y `prisma generate` automáticamente.

## Integración futura con Gmail OAuth
1. Registrar una app en Google Cloud y habilitar Gmail API (scopes `https://www.googleapis.com/auth/gmail.readonly`).
2. Guardar `CLIENT_ID`, `CLIENT_SECRET` y `REFRESH_TOKEN` en Vercel/`.env`.
3. Completar `src/infrastructure/email/gmail-provider.ts` para:
   - Generar tokens usando OAuth 2.0.
   - Invocar `users.messages.list` para traer los correos recientes.
   - Traer el cuerpo completo con `users.messages.get`.
4. Implementar adapters específicos por banco (`modules/email-ingestion/adapters`). Se registran en `serverContainer`.
5. Opcional: persistir el `historyId` de Gmail para hacer fetch incremental en vez de full sync.

## Obtener un refresh_token de Gmail (scripts locales)
1. Duplica `.env.example` en `.env` y completa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI` con los datos del OAuth Client ID creado en Google Cloud Console (la URI debe ser `http://localhost:3000/oauth2callback`). Habilita la Gmail API y configura el OAuth Consent Screen antes de continuar.
2. Instala dependencias (`npm install`) y ejecuta `npm run auth:gmail`. Este script levanta un servidor Express en `http://localhost:3000` (asegúrate de que Next.js esté apagado) y genera la URL de consentimiento con `access_type=offline`, `prompt=consent` y el scope mínimo `https://www.googleapis.com/auth/gmail.readonly`.
3. Abre la URL mostrada en consola, inicia sesión en la cuenta que leerá los correos bancarios y acepta los permisos. Google redirigirá a `/oauth2callback`, el script intercambiará el `code` con `OAuth2Client.getToken`, mostrará los tokens y guardará automáticamente `GOOGLE_REFRESH_TOKEN` **y** `GMAIL_REFRESH_TOKEN` en `.env`.
4. Si no aparece `refresh_token`, revoca el acceso desde [Google Account → Security → Third-party access](https://myaccount.google.com/permissions) y vuelve a ejecutar `npm run auth:gmail`. También sucede si no se usan los parámetros mencionados anteriormente.
5. Para comprobar que todo funciona, ejecuta `npm run gmail:inbox`, el cual usa `gmail.users.messages.list` para traer los últimos 5 correos de la bandeja de entrada y muestra `Subject/From/Date` (usa el `refresh_token` guardado).
6. Los correos se leen directamente desde la bandeja de entrada. Asegúrate de tener reglas/adaptadores que identifiquen los formatos válidos; el resto se omite automáticamente durante la ingesta.

### Solución de problemas comunes
- `redirect_uri_mismatch`: ve a Google Cloud Console → APIs & Services → Credentials → tu OAuth Client ID y asegúrate de que `http://localhost:3000/oauth2callback` esté en la lista de Redirect URIs.
- `access_denied` o `Error 403: access_blocked`: revisa la pantalla de consentimiento, añade la cuenta de prueba (si está en modo “Testing”) o cambia a “In production”.
- Sin `refresh_token` en la respuesta: confirma que `access_type=offline` y `prompt=consent` estén presentes; si ya autorizaste antes, revoca el acceso y repite.
- `invalid_client`: valida que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` coincidan exactamente con el archivo descargado desde Google Cloud.

## Autenticación básica
- Define `ADMIN_USERNAME` y `ADMIN_PASSWORD` en tu `.env` (y en Vercel). Estos datos se usan para el login simple ubicado en `/login`.
- El middleware bloquea todo el dashboard si no existe una sesión válida. Los cron jobs `/api/cron/*` quedan excluidos para que Vercel pueda invocarlos.
- El formulario de login compara las credenciales con las variables de entorno y, si coinciden, guarda una cookie HTTP-only con un token derivado de usuario+contraseña.
- Usa el botón “Cerrar sesión” del encabezado para borrar la cookie y volver al login.

## UI actual (MVP)
- **Dashboard (`/`):** resumen anual/mes corrido, buckets 50/30/20, gráfica con ingresos/gastos de los últimos 6 meses (con montos visibles por mes), selector de mes (inputs + prev/next), últimos movimientos y reglas activas.
- **Presupuesto (`/budget`):** formulario para registrar múltiples ingresos (nombre + monto) y ver el total del mes; los buckets 50/30/20 se calculan automáticamente. Incluye alta de categorías (con monto ideal mensual) y reglas, además de la vista agrupada por Needs/Wants/Savings.
- **Transacciones (`/transactions`):** pestañas para (1) registrar/editar movimientos manuales, (2) definir planes programados que se ejecutan con un cron diario y (3) revisar/editar borradores automáticos antes de aprobarlos.

Todo el UI usa server components y datos provenientes de los casos de uso, lo que facilita exponer la misma lógica hacia APIs o automatizaciones sin duplicar reglas.
