## Presupuesto 50/30/20 – Construyendo mi copiloto financiero rumbo a 2026

2025 será el año en el que mis finanzas personales escalen a otro nivel. Creé **Presupuesto 50/30/20**, una app full-stack con Next.js que centraliza ingresos, gastos y reglas de ahorro, y la estoy preparando para que el 2026 arranque con todo automatizado sobre infraestructura AWS.

### ¿Por qué la construí?
- Quería un tablero que mostrara cómo se comportan mis buckets 50/30/20 mes a mes (ingresos, gastos y delta real vs. meta).
- Necesito aprobar transacciones con contexto (reglas, etiquetas, borradores automáticos) y evitar la tediosa digitación manual.
- Busco insights accionables: detectar el mes con más gastos, categorías con mayor fuga y tendencias de ahorro para ajustar a tiempo.

### ¿Qué resuelve hoy?
1. **Autenticación y multiusuario** con Cognito + Prisma (cada tabla está aislada por `userId`).
2. **Ingesta automática desde Gmail**: conecto mi bandeja vía OAuth, las Lambdas convierten correos bancarios en borradores, y apruebo sólo lo que tiene sentido.
3. **Planes programados**: reglas (tipo suscripciones, renta) que se ejecutan automáticamente y se reflejan en el presupuesto.
4. **Dashboard inteligente**: selección de mes, gráficos de buckets, categorías top y resumen de ingresos/gastos, todo en server components.
5. **Alertas y análisis**: el módulo de estadísticas compara periodos, identifica el mes con más ingresos/gastos y arma gráficos para entender el consumo acumulado.

### Hacia dónde voy
- Consolidar la infraestructura en AWS: Cognito para login, EventBridge como bus de eventos y Lambdas para procesar correo/cron jobs, todo en el marco de mi preparación para el certificado **AWS Developer**.
- Incorporar filtros/labels dinámicos en Gmail para separar notificaciones bancarias por `userId`.
- Seguir afinando los pipelines de análisis para llegar a 2026 con un histórico sólido y decisiones basadas en datos reales, no en suposiciones.

Si estás trabajando en automatizar tus finanzas o te interesa la intersección entre email parsing y budgeting, feliz de intercambiar ideas. Mientras ajusto mis números rumbo a 2026, sigo firme con el roadmap de certificación **AWS Developer** para llevar estas ideas a producción sobre AWS (Cognito, EventBridge, Lambdas) con estándares cloud. 💡
