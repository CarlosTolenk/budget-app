-- Shift historical records to align with UTC-4 (America/Santo_Domingo)

UPDATE "Transaction"
SET
  "date" = "date" + interval '4 hours',
  "updatedAt" = now()
WHERE EXTRACT(HOUR FROM "date") = 0
  AND EXTRACT(MINUTE FROM "date") = 0
  AND EXTRACT(SECOND FROM "date") = 0;

UPDATE "TransactionDraft"
SET
  "date" = "date" + interval '4 hours',
  "updatedAt" = now()
WHERE EXTRACT(HOUR FROM "date") = 0
  AND EXTRACT(MINUTE FROM "date") = 0
  AND EXTRACT(SECOND FROM "date") = 0;

UPDATE "ScheduledTransaction"
SET
  "startDate" = "startDate" + interval '4 hours',
  "nextRunDate" = "nextRunDate" + interval '4 hours',
  "updatedAt" = now()
WHERE EXTRACT(HOUR FROM "startDate") = 0
  AND EXTRACT(MINUTE FROM "startDate") = 0
  AND EXTRACT(SECOND FROM "startDate") = 0
  AND EXTRACT(HOUR FROM "nextRunDate") = 0
  AND EXTRACT(MINUTE FROM "nextRunDate") = 0
  AND EXTRACT(SECOND FROM "nextRunDate") = 0;
