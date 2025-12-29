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
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    GMAIL_CLIENT_ID=
    GMAIL_CLIENT_SECRET=
    GMAIL_REFRESH_TOKEN=
     ```
   - `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` apuntan al proyecto de Supabase que gestionará las sesiones. `SUPABASE_SERVICE_ROLE_KEY` sólo se usa del lado del servidor (cron/queues) y **nunca** se expone en el cliente.
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
2. Configurar las mismas variables de entorno (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GMAIL_*`). Para Vercel Postgres, `DATABASE_URL` suele apuntar al string con pooling y `DIRECT_URL` al puerto directo (para migraciones). Además, recuerda cambiar el `provider` del datasource a `"postgresql"` antes del deploy.
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
1. Duplica `.env.example` en `.env` y completa `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y `GOOGLE_REDIRECT_URI` con los datos del OAuth Client ID creado en Google Cloud Console (la URI debe incluir `http://localhost:3000/api/oauth/google/callback` para desarrollo y la versión HTTPS en producción). Habilita la Gmail API y configura el OAuth Consent Screen antes de continuar.
2. Instala dependencias (`npm install`) y ejecuta `npm run auth:gmail`. Este script levanta un servidor Express en `http://localhost:3000` (asegúrate de que Next.js esté apagado) y genera la URL de consentimiento con `access_type=offline`, `prompt=consent` y el scope mínimo `https://www.googleapis.com/auth/gmail.readonly`.
3. Abre la URL mostrada en consola, inicia sesión en la cuenta que leerá los correos bancarios y acepta los permisos. Google redirigirá a `/api/oauth/google/callback`, el script intercambiará el `code` con `OAuth2Client.getToken`, mostrará los tokens y guardará automáticamente `GOOGLE_REFRESH_TOKEN` **y** `GMAIL_REFRESH_TOKEN` en `.env`.
4. Si no aparece `refresh_token`, revoca el acceso desde [Google Account → Security → Third-party access](https://myaccount.google.com/permissions) y vuelve a ejecutar `npm run auth:gmail`. También sucede si no se usan los parámetros mencionados anteriormente.
5. Para comprobar que todo funciona, ejecuta `npm run gmail:inbox`, el cual usa `gmail.users.messages.list` para traer los últimos 5 correos de la bandeja de entrada y muestra `Subject/From/Date` (usa el `refresh_token` guardado).
6. Los correos se leen directamente desde la bandeja de entrada. Asegúrate de tener reglas/adaptadores que identifiquen los formatos válidos; el resto se omite automáticamente durante la ingesta.

### Solución de problemas comunes
- `redirect_uri_mismatch`: ve a Google Cloud Console → APIs & Services → Credentials → tu OAuth Client ID y asegúrate de que `http://localhost:3000/oauth2callback` esté en la lista de Redirect URIs.
- `access_denied` o `Error 403: access_blocked`: revisa la pantalla de consentimiento, añade la cuenta de prueba (si está en modo “Testing”) o cambia a “In production”.
- Sin `refresh_token` en la respuesta: confirma que `access_type=offline` y `prompt=consent` estén presentes; si ya autorizaste antes, revoca el acceso y repite.
- `invalid_client`: valida que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` coincidan exactamente con el archivo descargado desde Google Cloud.

## Autenticación con Supabase
- La ruta `/login` usa Supabase Auth (email/password). Crea usuarios desde el panel de Supabase o habilita self-service signup si lo prefieres.
- El middleware (`middleware.ts`) utiliza `createMiddlewareClient` para hidratar la sesión en cada request y redirigir automáticamente a `/login` cuando no exista.
- `requireAuth` se apoya en Supabase para todas las páginas server-side (`app/page.tsx`, `/budget`, `/stats`, `/transactions`, etc.).
- El botón “Cerrar sesión” ejecuta `supabase.auth.signOut()` vía server action. Las cookies `sb-...` se regeneran automáticamente.

## Conexión de Gmail por usuario
- Cada usuario puede vincular su bandeja desde la pestaña “Borradores automáticos” en `/transactions` (botón **Conectar Gmail**). Esto dispara `/api/oauth/google/start`, abre el consentimiento de Google y, tras aceptar, ` /api/oauth/google/callback` persiste el `refresh_token` en la tabla `GmailCredential`.
- Los tokens se almacenan por `userId`, por lo que la ingesta (`ProcessIncomingEmailsUseCase`) crea borradores usando el refresh token de cada usuario. Si no existe credencial, las acciones que intenten importar devolverán `No hay una conexión de Gmail configurada`.
- Para entornos donde quieras seguir usando un único Gmail global, deja configurado `GMAIL_CLIENT_ID/GMAIL_CLIENT_SECRET/GMAIL_REFRESH_TOKEN`; ese valor actúa como fallback mientras los usuarios completan su propio OAuth.

## UI actual (MVP)
- **Dashboard (`/`):** resumen anual/mes corrido, buckets 50/30/20, gráfica con ingresos/gastos de los últimos 6 meses (con montos visibles por mes), selector de mes (inputs + prev/next), últimos movimientos y reglas activas.
- **Presupuesto (`/budget`):** formulario para registrar múltiples ingresos (nombre + monto) y ver el total del mes; los buckets 50/30/20 se calculan automáticamente. Incluye alta de categorías (con monto ideal mensual) y reglas, además de la vista agrupada por Needs/Wants/Savings.
- **Transacciones (`/transactions`):** pestañas para (1) registrar/editar movimientos manuales, (2) definir planes programados que se ejecutan con un cron diario y (3) revisar/editar borradores automáticos antes de aprobarlos.

Todo el UI usa server components y datos provenientes de los casos de uso, lo que facilita exponer la misma lógica hacia APIs o automatizaciones sin duplicar reglas.

## Roadmap multiusuario + Gmail OAuth individual
Esta es la guía para convertir el MVP en una plataforma multiusuario donde cada persona conecta su cuenta de Gmail con OAuth y mantiene sus datos aislados.

### 1. Autenticación y sesiones con Supabase
1. Crea un proyecto en [Supabase](https://supabase.com/) (plan gratuito basta para el MVP) y habilita el proveedor de email/password en `Authentication → Providers`.
2. Registra las variables en `.env` / Vercel:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=... # solo en el backend para acciones privilegiadas (cron/jobs)
   ```
3. Instala `@supabase/ssr` (el reemplazo de los antiguos auth-helpers) y sigue la guía de middleware para Next App Router.
4. Crea un wrapper server-side (`requireAuth`) que:
   - Obtenga la sesión de Supabase.
   - Cargue/cree un perfil en tu DB (véase siguiente sección).
5. Ajusta las rutas protegidas para que lean `userId` desde la sesión (ya no dependeremos de credenciales `.env`).

### 2. Migrar datos para soportar múltiples usuarios
1. **Nuevo modelo `User`:**
   - Añade una tabla `User` en Prisma (campos mínimos: `id`, `supabaseUserId`, `email`, timestamps).
   - Sincroniza con `prisma migrate`.
2. **Propagar `userId`:**
   - Agrega una columna `userId` (FK) en cada tabla de negocio (`Transaction`, `Income`, `Budget`, `Category`, `Rule`, etc.).
   - Migra la data existente: crea un usuario “admin” con el `supabaseUserId` que usarás y actualiza todas las filas previas para apuntar a ese usuario.
3. **Repositorios y casos de uso:**
   - Todos los `repository` deberán filtrar por `userId`.
   - Los use cases reciben ahora `context: { userId }` (o parámetro adicional) y lo pasan a los repositorios.
4. **Semillas/borradores:**
   - Cuando se importen correos o se creen borradores automáticos, guarda el `userId` del dueño en la transacción borrador.
5. **Middlewares/API routes:**
   - Verifica el `userId` en cada handler; evita exponer datos entre usuarios.

### 3. OAuth individual de Gmail por usuario
1. Reutiliza el proyecto de Google Cloud actual (solo necesitas un `OAuth Client ID`). Configura las URIs de redirect que usará tu app (`https://app.com/api/oauth/google/callback` y `http://localhost:3000/api/oauth/google/callback` para dev).
2. Crea un endpoint `/api/oauth/google/start` que redirija a Google con:
   - Scope `https://www.googleapis.com/auth/gmail.readonly`
   - `access_type=offline` y `prompt=consent`
   - Un parámetro `state` firmado que incluya el `userId`.
3. Implementa `/api/oauth/google/callback`:
   - Valida el `state`.
   - Intercambia el `code` por `access_token` + `refresh_token`.
   - Guarda el `refresh_token` cifrado en una tabla `GmailCredential` ligada al `userId` (campos sugeridos: `userId`, `refreshToken`, `historyId`, `labelIds`, `createdAt`).
4. **Sincronización recurrente:**
   - Crea un job (cron o queue) que:
     1. Obtenga todas las credenciales activas.
     2. Para cada usuario, refresque el token, lea los mensajes nuevos (usando `historyId` para fetch incremental) y cree borradores con `userId`.
     3. Maneje errores individuales (si un token falla, marcar al usuario como “requiere reconexión”).
5. **Filtros/etiquetas automáticas (opcional):**
   - Con OAuth puedes crear etiquetas/filtros por API (`Gmail.users.labels` y `Gmail.users.settings.filters`) para separar notificaciones bancarias dentro del propio correo del usuario.
6. **Panel de usuario:**
   - Añade una pantalla “Integraciones” donde se vea el estado de Gmail (conectado, último sync, errores) y botones para reconectar o revocar el permiso.

### 4. Consideraciones adicionales
- **Seguridad:** cifra los `refresh_token` (ej. con KMS o libsodium) y limita quién puede leerlos (solo el worker/cron). Loguea únicamente IDs; nunca el token plano.
- **Supervisión:** guarda métricas del sync (correo procesado, errores, `historyId` actual) para depurar fácilmente.
- **Backfill:** cuando un usuario se conecta la primera vez, permite seleccionar un rango inicial de meses para importar (p.ej. últimos 3–6 meses) antes de pasar al modo incremental.
- **Soporte manual:** provee instrucciones y herramientas para rotar tokens, resetear `historyId`, reintentar ingestiones o transferir datos entre usuarios si fuese necesario.

Siguiendo estos pasos tendrás autenticación gestionada por Supabase, datos segregados por usuario y un flujo de conexión Gmail automatizado y seguro que escala con la misma lógica de ingesta existente.
