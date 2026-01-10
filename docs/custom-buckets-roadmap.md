# Custom Buckets Roadmap

Documento de trabajo para introducir buckets personalizables (hasta 6 por usuario) manteniendo el preset 50/30/20 como modo guiado opcional.

---

## 0. Objetivos y alcance
- Permitir dos modos: `preset` (50/30/20 con metas sugeridas) y `custom` (hasta 6 buckets nombrados por el usuario, sin metas automáticas).
- Mantener el historial existente; ningún gasto, categoría o regla se debe perder durante la migración.
- Habilitar un flujo para cambiar de preset → custom y viceversa, sin requerir soporte manual.
- Evitar sugerencias de metas en modo custom; los usuarios controlan solo el seguimiento por bucket.

Fuera de alcance: rediseño visual completo del dashboard o cambios a reportes históricos fuera del uso de buckets.

---

## 1. Esquema de datos
1. **Crear tabla `UserBucket`:**
   - Campos: `id (cuid)`, `userId`, `name`, `sortOrder (int)`, `color (string, opcional)`, `mode ("preset" | "custom")`, `presetKey ("NEEDS" | "WANTS" | "SAVINGS" | null)`, timestamps.
   - Constraint: máximo 6 buckets `custom` por usuario. Para `preset`, se mantienen exactamente tres filas.
2. **Actualizar entidades existentes:**
   - `Category`, `Transaction`, `TransactionDraft`, `ScheduledTransaction`, `Rule` deben referenciar `userBucketId` (FK) y eliminar el enum `Bucket`.
   - `Budget`: reemplazar campos `needsTarget|wantsTarget|savingsTarget` por tabla hija `BudgetBucket { id, budgetId, userBucketId, targetAmount }`. Mantener `income`.
3. **Migración inicial:**
   - Por cada usuario crear tres `UserBucket` con `mode="preset"` y `presetKey` acorde.
   - Poblar `BudgetBucket` desde `needsTarget|wantsTarget|savingsTarget`.
   - Actualizar filas en tablas dependientes asignando el `userBucketId` según el bucket actual.
4. **Eliminar enum Prisma `Bucket` y ejecutar migraciones (cambios en `schema.prisma`).**

---

## 2. Capa de dominio y repositorios
1. Introducir `UserBucket` en `domain/value-objects` (id, name, ratios opcionales) y repositorio `UserBucketRepository`.
2. Actualizar `Category`, `Transaction`, `ScheduledTransaction`, `TransactionDraft` y sus repositorios para usar `userBucketId`.
3. Reemplazar todos los usos de `Bucket`, `bucketCopy`, `bucketOrder`:
   - Crear un helper `PresetBuckets` solo para seed / copy.
   - Exponer los buckets dinámicamente desde repositorios en cada use case.
4. Ajustar `get-dashboard-summary`, `get-financial-stats`, reglas de alertas, etc., para agregar datos agrupando por `UserBucket`.
5. Validaciones `zod` en acciones server: cambiar `z.enum` por `z.string().cuid()` + verificación en server confirmando propiedad del bucket.

---

## 3. Experiencia de usuario
1. **Configuración de buckets:**
   - Nueva sección en `/budget` (o `/settings/buckets`) para listar buckets activos, permitir renombrar, crear (hasta 6), ordenar y eliminar (con asistente para mover categorías antes de borrar).
   - Mostrar modo actual (`preset` o `custom`) con CTA para cambiar. Cambiar a custom desbloquea edición.
2. **Formularios existentes:**
   - `CategoryForm`, `TransactionForm`, `ScheduledTransactionForm`, `transactions-tabs`, `transaction-actions` deben recibir la lista de buckets desde server components/props y renderizar selects dinámicos.
   - El valor enviado es `userBucketId`.
3. **Dashboard/Budget UI:**
   - En modo preset, mantener textos educativos y porcentajes.
   - En modo custom, ocultar referencias a “50/30/20” o metas sugeridas. Mostrar únicamente montos planificados/gastados.
4. **Estado vacío en custom:** si no hay metas, mostrar mensajes aclarando que los usuarios pueden usar la sección de buckets para definir nombres y colores, pero no se sugieren porcentajes.

---

## 4. Flujo preset ↔ custom
1. **Cambio a custom:**
   - Marca en `UserBucket` las filas existentes como `mode="custom"` y permite renombrarlas (sin borrar por defecto).
   - Si el usuario quiere eliminar un bucket, forzar reasignar categorías/transacciones futuras antes de confirmar.
2. **Cambio a preset:**
   - Re-crear (o reactivar) las tres filas estándar con nombres/ratios originales.
   - Reasignar cualquier categoría que estuviera en un bucket eliminado mostrando un modal para elegir destino.
3. **Persistir preferencias:** almacenar `user.bucketMode` para condicionar la UI y los cálculos (p.ej., `targetRatio` solo aplica al preset).

---

## 5. Ingesta automática y reglas
1. `email-ingestion` y `bucket-detector`:
   - En preset: seguir mapeando a buckets estándar usando `presetKey` → `userBucketId`.
   - En custom: si no hay heurística, dejar el draft sin bucket y requerir intervención manual, o permitir configurar un bucket por defecto en ajustes.
2. Reglas (`Rule`): agregar `userBucketId` o inferirlo desde la categoría vinculada; validar al aplicar que la categoría pertenezca al bucket seleccionado.

---

## 6. Estrategia de despliegue
1. **Feature flag** (`NEXT_PUBLIC_CUSTOM_BUCKETS` + flag server) para ocultar el nuevo UI mientras se migran datos.
2. **Migración por pasos:**
   - Deploy 1: agregar tablas/columnas nuevas + backfill sin quitar enum; mantener código legacy.
   - Deploy 2: actualizar backend para usar `userBucketId` únicamente.
   - Deploy 3: limpiar campos antiguos (`needsTarget`, enum) una vez estable.
3. **Rollback plan:** mantener columnas legacy pobladas por un par de releases para poder restaurar si es necesario.

---

## 7. QA y verificación
- Cobertura de pruebas para use cases que agregan/actualizan transacciones, categorías, budgets y drafts.
- Tests e2e/manuales que validen:
  - Crear buckets custom, renombrarlos y cambiar orden.
  - Migrar de preset a custom y viceversa sin pérdida de datos.
  - Formularios deshabilitados cuando no hay buckets.
  - Ingesta de emails crea drafts sin bucket y los muestra como pendientes.
- Validar reportes históricos (gráficas, totales) con usuarios que tienen más de un año de datos.

---

## 8. Documentación y comunicación
- Actualizar `README.md` y marketing copy para explicar los dos modos.
- Añadir guía rápida in-app al cambiar a custom (tooltip o modal).
- Documentar en soporte cómo resolver inconsistencias (p.ej., qué hacer si un bucket queda sin categorías).

---

Con este roadmap el siguiente prompt puede abordar la implementación paso a paso sabiendo qué piezas del sistema deben tocarse y en qué orden.
