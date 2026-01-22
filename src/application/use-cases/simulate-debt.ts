import type { DebtSimulationInput, DebtSimulationResult } from "@/modules/debt-analysis";
import { simulateSchedule } from "@/modules/debt-analysis";

export class SimulateDebtUseCase {
  execute(input: DebtSimulationInput): DebtSimulationResult {
    return simulateSchedule(input);
  }
}
