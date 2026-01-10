# Custom Buckets · QA Checklist

Este checklist cubre los escenarios descritos en la sección 7 del roadmap. Se divide en pruebas automatizables (unit/integration) y flujos manuales/e2e.

## Pruebas automatizables
1. **Casos de uso y acciones server**
   - `createUserBucketAction` y `renameUserBucketAction` devuelven errores cuando el modo no es `CUSTOM` o al rebasar `MAX_CUSTOM_BUCKETS`.
   - `updateBucketModeAction` con mapping:
     - Marca todos los buckets como `CUSTOM`.
     - Al volver a `PRESET`, transfiere categorías/reglas/transacciones/scheduled/drafts/budget buckets al preset seleccionado.
   - `deleteCustomBucketAction` requiere `targetBucketId` válido y mueve datos antes de borrar.
2. **Ingesta automática**
   - `EmailIngestionService` en modo preset crea/usa `UserBucket` por `presetKey` si no existe.
   - En modo custom ignora el `presetBucket` sugerido por adapters y usa el bucket personalizado por defecto; si no hay uno disponible, marca el mail como skipped.
3. **Repositorios**
   - `PrismaUserBucketRepository.transferData` y `reorder` mantienen integridad (todas las entidades apuntan a buckets activos).
   - `GetDashboardSummaryUseCase` filtra buckets por modo actual y no aplica porcentajes al modo custom.

## Pruebas manuales / E2E
1. **Configuración de buckets**
   - Crear hasta 6 buckets personalizados, renombrarlos, asignar colores y reordenarlos (drag + botones).
   - Eliminar un bucket validando que el modal obligue a seleccionar destino y que todas las categorías reglamentarias se muevan.
2. **Cambio de modo**
   - Pasar de preset → custom: confirmar que los nombres originales permanecen y que el UI permite editar.
   - Volver a preset usando el modal de reasignación:
     - Seleccionar destinos distintos para cada bucket personalizado y validar que las categorías/transacciones aparecen en el preset elegido.
     - Reabrir el dashboard y `/budget` para verificar que los montos planeados/gastados coinciden.
3. **Formularios existentes**
   - `CategoryForm`, `TransactionForm`, `ScheduledTransactionForm`, `transactions-tabs`, `transaction-actions`: asegurarse de que los selects muestran los buckets del modo activo y se deshabilitan cuando no hay buckets.
4. **Ingesta de emails**
   - Con el modo preset: enviar un correo soportado por un adapter y confirmar que el borrador cae en el bucket correspondiente (NEEDS/WANTS/SAVINGS).
   - Con el modo custom: repetir la ingesta y verificar que el draft queda en el bucket personalizado por defecto (o sin bucket si no hay uno), mostrando el estado pendiente.
5. **Reportes y dashboard**
   - Revisar `/`, `/budget`, `/stats` con usuarios que tengan >12 meses de datos:
     - En modo preset, la UI debe seguir mostrando los porcentajes 50/30/20 y metas.
     - En modo custom, desaparecer referencias a metas automáticas; solo se muestran planificado vs gastado.
   - Cambiar de mes/año para confirmar que los datos históricos se mantienen consistentes.
6. **Estados vacíos**
   - Modo custom sin buckets: los formularios deben mostrar mensajes claros y bloquear envíos hasta crear uno.
   - Budget sin ingresos/categorías: validar que la UI no crashea en ninguno de los modos.

## Notas
- Registrar capturas o videos al ejecutar los flujos críticos (cambio de modo e ingesta) para futura referencia.
- Antes de promover a producción, ejecutar este checklist en un entorno staging con datos reales o importados para detectar regresiones en reportes históricos.
