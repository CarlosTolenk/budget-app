# Custom Buckets · Estrategia de despliegue

Este documento resume cómo habilitar gradualmente los buckets personalizados en producción siguiendo la sección 6 del roadmap.

## 1. Feature flag
- `NEXT_PUBLIC_CUSTOM_BUCKETS` (default `off`) controla la visibilidad del selector preset/custom y la rejilla editable en `/budget`.
- Mantén el flag en `off` durante la migración inicial para que los usuarios sigan viendo el flujo 50/30/20 “legacy”.
- Cuando el flag esté `on`, el selector muestra el nuevo modal de reasignación y los buckets personalizados quedan disponibles en todas las vistas (dashboard, transactions, etc.).
- A nivel server, todos los endpoints ya trabajan con `UserBucket`, así que no se requiere un segundo flag del lado del backend.

## 2. Plan de despliegue por pasos
1. **Deploy 1 – Infraestructura**
   - Ejecuta las migraciones Prisma que introducen `User`, `UserBucket`, `BudgetBucket` y los campos `userBucketId` en todas las tablas.
   - Corre los scripts de backfill para crear los tres buckets preset por usuario y traspasar `needs|wants|savings` → `BudgetBucket`.
   - `NEXT_PUBLIC_CUSTOM_BUCKETS` permanece en `off`.
2. **Deploy 2 – Backend/UI híbrido**
   - Reemplaza todo uso del enum `Bucket` por `userBucketId` (ya hecho en el código actual).
   - Despliega el nuevo selector + rejilla pero deja el flag en `off` para probar internamente.
   - Importante: asegura que el modal de “volver a preset” esté funcionando y que la ingesta automática respete el modo actual.
3. **Deploy 3 – Limpieza y activación**
   - Activa `NEXT_PUBLIC_CUSTOM_BUCKETS=on` para usuarios finales.
   - Elimina campos legacy (`needsTarget|wantsTarget|savingsTarget`, enum `Bucket`) cuando verifiques que no hay referencias pendientes.

## 3. Rollback plan
- Mientras los campos legacy sigan poblados (Deploy 1 y 2), puedes volver al código previo simplemente apagando el flag frontend y redeployando la versión anterior.
- Si el flag está `on` y necesitas revertir:
  1. Cambia `NEXT_PUBLIC_CUSTOM_BUCKETS=off` para ocultar el selector (usuarios quedan en el modo que tuvieran configurado).
  2. Ejecuta `updateBucketModeAction("PRESET")` vía script si necesitas forzar el modo guiado para todos los usuarios.
  3. Mantén los datos en `UserBucket` aunque vuelvas a la UI antigua; las categorías/ transacciones conservan el `userBucketId`, por lo que no hay pérdida de información.
- Antes de eliminar columnas legacy asegúrate de contar con un backup (dump) de la base y con los scripts de transferencias (`transferData`) listos para rehacer la migración en caso necesario.
