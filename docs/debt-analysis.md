# Debt / Loan Analysis Module

## Supuestos y fórmulas
- **Tasa anual**: se ingresa como decimal en el motor (`0.18` = 18%).
- **APR nominal**: `monthlyRate = annualRate / 12`.
- **APR efectivo**: `monthlyRate = (1 + annualRate)^(1/12) - 1`.
- **Interés mensual**: `interest = balance * monthlyRate` (redondeado a centavos).
- **Aplicación de pago**: `fees → interés → capital`. Los abonos extra se aplican **después** del pago regular y solo a capital.
- **Ajuste de último pago**: el pago final se recorta para evitar saldo negativo.
- **Rounding**: se usan centavos como enteros (2 decimales por defecto).
- **Pago base**: si se proveen `termMonths` y `minPayment`, se usa el mayor de ambos.
- **No amortizable**: si el pago total (regular + extra) es menor o igual al interés + fees del mes, se marca como no amortizable.

## Modos de abono
- `reduce_term`: mantiene la cuota regular, reduce el plazo.
- `reduce_payment`: recalcula la cuota usando el saldo restante y el plazo pendiente.

## Estrategias
- **Snowball**: menor saldo primero (tie-breaker: mayor tasa).
- **Avalanche**: mayor tasa primero (tie-breaker: menor saldo).
- **Presupuesto extra**: primero se pagan mínimos, el extra se aplica a una sola deuda objetivo. Cuando una deuda se paga, su mínimo se libera para el presupuesto futuro.
- **Inicio de extra mensual**: puedes definir `budgetStartMonth` (YYYY-MM). Antes de ese mes solo se pagan mínimos; desde ese mes se aplica el extra mensual.
- **Moneda**: todas las deudas del plan deben usar la misma moneda.

## Payloads de ejemplo

### Simular una deuda
```json
{
  "debt": {
    "id": "cc-1",
    "name": "Tarjeta principal",
    "principal": 25000,
    "annualRate": 0.185,
    "startDate": "2026-01",
    "termMonths": 24,
    "feesMonthly": 0,
    "currency": "DOP",
    "aprType": "nominal"
  },
  "extraPayments": [
    { "applyTo": "cc-1", "date": "2026-03", "amount": 1500, "mode": "reduce_term" }
  ],
  "rounding": { "decimals": 2 }
}
```

### Planificar estrategias
```json
{
  "debts": [
    {
      "id": "cc-1",
      "name": "Tarjeta principal",
      "principal": 25000,
      "annualRate": 0.185,
      "startDate": "2026-01",
      "termMonths": 24,
      "currency": "DOP",
      "aprType": "nominal"
    },
    {
      "id": "loan-1",
      "name": "Préstamo personal",
      "principal": 120000,
      "annualRate": 0.12,
      "startDate": "2026-01",
      "minPayment": 6200,
      "currency": "DOP",
      "aprType": "effective"
    }
  ],
  "budget": {
    "monthlyExtraBudget": 2000,
    "strategy": "snowball",
    "rounding": { "decimals": 2 }
  },
  "extraPayments": [
    { "applyTo": "cc-1", "date": "2026-03", "amount": 1500, "mode": "reduce_term" }
  ]
}
```
