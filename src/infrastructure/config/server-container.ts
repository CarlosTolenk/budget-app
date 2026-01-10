import { GetDashboardSummaryUseCase } from "@/application/use-cases/get-dashboard-summary";
import { ListTransactionsUseCase } from "@/application/use-cases/list-transactions";
import { ListCategoriesUseCase } from "@/application/use-cases/list-categories";
import { ListRulesUseCase } from "@/application/use-cases/list-rules";
import { ProcessIncomingEmailsUseCase } from "@/application/use-cases/process-incoming-emails";
import { UpsertBudgetUseCase } from "@/application/use-cases/upsert-budget";
import { CreateCategoryUseCase } from "@/application/use-cases/create-category";
import { UpdateCategoryUseCase } from "@/application/use-cases/update-category";
import { DeleteCategoryUseCase } from "@/application/use-cases/delete-category";
import { CreateRuleUseCase } from "@/application/use-cases/create-rule";
import { CreateTransactionUseCase } from "@/application/use-cases/create-transaction";
import { UpdateTransactionUseCase } from "@/application/use-cases/update-transaction";
import { DeleteTransactionUseCase } from "@/application/use-cases/delete-transaction";
import { CreateIncomeUseCase } from "@/application/use-cases/create-income";
import { ListIncomesUseCase } from "@/application/use-cases/list-incomes";
import { GetYearlyOverviewUseCase } from "@/application/use-cases/get-yearly-overview";
import { GetFinancialStatsUseCase } from "@/application/use-cases/get-financial-stats";
import { UpdateIncomeUseCase } from "@/application/use-cases/update-income";
import { DeleteIncomeUseCase } from "@/application/use-cases/delete-income";
import { PrismaTransactionRepository } from "@/infrastructure/repositories/prisma/prisma-transaction-repository";
import { PrismaBudgetRepository } from "@/infrastructure/repositories/prisma/prisma-budget-repository";
import { PrismaCategoryRepository } from "@/infrastructure/repositories/prisma/prisma-category-repository";
import { PrismaRuleRepository } from "@/infrastructure/repositories/prisma/prisma-rule-repository";
import { PrismaUserBucketRepository } from "@/infrastructure/repositories/prisma/prisma-user-bucket-repository";
import { MemoryTransactionRepository } from "@/infrastructure/repositories/memory/memory-transaction-repository";
import { MemoryBudgetRepository } from "@/infrastructure/repositories/memory/memory-budget-repository";
import { MemoryCategoryRepository } from "@/infrastructure/repositories/memory/memory-category-repository";
import { MemoryRuleRepository } from "@/infrastructure/repositories/memory/memory-rule-repository";
import { MemoryUserBucketRepository } from "@/infrastructure/repositories/memory/memory-user-bucket-repository";
import { MemoryIncomeRepository } from "@/infrastructure/repositories/memory/memory-income-repository";
import { GmailProvider } from "@/infrastructure/email/gmail-provider";
import { GenericBankAdapter } from "@/modules/email-ingestion/adapters/generic-bank-adapter";
import { BancoPopularAdapter } from "@/modules/email-ingestion/adapters/banco-popular-adapter";
import { BancoSantaCruzAdapter } from "@/modules/email-ingestion/adapters/banco-santa-cruz-adapter";
import { AsociacionCibaoAdapter } from "@/modules/email-ingestion/adapters/asociacion-cibao-adapter";
import { QikAdapter } from "@/modules/email-ingestion/adapters/qik-adapter";
import { EmailIngestionService } from "@/modules/email-ingestion/services/email-ingestion-service";
import { MockEmailProvider } from "@/modules/email-ingestion/mocks/mock-provider";
import { EmailProviderResolver } from "@/modules/email-ingestion/services/email-provider-resolver";
import { env } from "@/infrastructure/config/env";
import { PrismaIncomeRepository } from "@/infrastructure/repositories/prisma/prisma-income-repository";
import { PrismaScheduledTransactionRepository } from "@/infrastructure/repositories/prisma/prisma-scheduled-transaction-repository";
import { PrismaTransactionDraftRepository } from "@/infrastructure/repositories/prisma/prisma-transaction-draft-repository";
import { MemoryScheduledTransactionRepository } from "@/infrastructure/repositories/memory/memory-scheduled-transaction-repository";
import { MemoryTransactionDraftRepository } from "@/infrastructure/repositories/memory/memory-transaction-draft-repository";
import { CreateScheduledTransactionUseCase } from "@/application/use-cases/create-scheduled-transaction";
import { ListScheduledTransactionsUseCase } from "@/application/use-cases/list-scheduled-transactions";
import { RunScheduledTransactionsUseCase } from "@/application/use-cases/run-scheduled-transactions";
import { ListTransactionDraftsUseCase } from "@/application/use-cases/list-transaction-drafts";
import { ApproveTransactionDraftUseCase } from "@/application/use-cases/approve-transaction-draft";
import { DeleteTransactionDraftUseCase } from "@/application/use-cases/delete-transaction-draft";
import { DeleteScheduledTransactionUseCase } from "@/application/use-cases/delete-scheduled-transaction";
import { UpdateRuleUseCase } from "@/application/use-cases/update-rule";
import { DeleteRuleUseCase } from "@/application/use-cases/delete-rule";
import { UserRepository } from "@/domain/repositories/user-repository";
import { PrismaUserRepository } from "@/infrastructure/repositories/prisma/prisma-user-repository";
import { MemoryUserRepository } from "@/infrastructure/repositories/memory/memory-user-repository";
import { UserBucketRepository } from "@/domain/repositories/user-bucket-repository";
import { GmailCredentialRepository } from "@/domain/repositories";
import { PrismaGmailCredentialRepository } from "@/infrastructure/repositories/prisma/prisma-gmail-credential-repository";
import { MemoryGmailCredentialRepository } from "@/infrastructure/repositories/memory/memory-gmail-credential-repository";

interface ServerContainer {
  getDashboardSummaryUseCase: GetDashboardSummaryUseCase;
  listTransactionsUseCase: ListTransactionsUseCase;
  listCategoriesUseCase: ListCategoriesUseCase;
  listRulesUseCase: ListRulesUseCase;
  processIncomingEmailsUseCase: ProcessIncomingEmailsUseCase;
  upsertBudgetUseCase: UpsertBudgetUseCase;
  createCategoryUseCase: CreateCategoryUseCase;
  updateCategoryUseCase: UpdateCategoryUseCase;
  deleteCategoryUseCase: DeleteCategoryUseCase;
  createRuleUseCase: CreateRuleUseCase;
  updateRuleUseCase: UpdateRuleUseCase;
  deleteRuleUseCase: DeleteRuleUseCase;
  createTransactionUseCase: CreateTransactionUseCase;
  createIncomeUseCase: CreateIncomeUseCase;
  updateIncomeUseCase: UpdateIncomeUseCase;
  deleteIncomeUseCase: DeleteIncomeUseCase;
  listIncomesUseCase: ListIncomesUseCase;
  getYearlyOverviewUseCase: GetYearlyOverviewUseCase;
  getFinancialStatsUseCase: GetFinancialStatsUseCase;
  updateTransactionUseCase: UpdateTransactionUseCase;
  deleteTransactionUseCase: DeleteTransactionUseCase;
  createScheduledTransactionUseCase: CreateScheduledTransactionUseCase;
  listScheduledTransactionsUseCase: ListScheduledTransactionsUseCase;
  runScheduledTransactionsUseCase: RunScheduledTransactionsUseCase;
  listTransactionDraftsUseCase: ListTransactionDraftsUseCase;
  approveTransactionDraftUseCase: ApproveTransactionDraftUseCase;
  deleteTransactionDraftUseCase: DeleteTransactionDraftUseCase;
  deleteScheduledTransactionUseCase: DeleteScheduledTransactionUseCase;
  userRepository: UserRepository;
  userBucketRepository: UserBucketRepository;
  gmailCredentialRepository: GmailCredentialRepository;
}

let cachedContainer: ServerContainer | null = null;

export function serverContainer(): ServerContainer {
  if (cachedContainer) {
    return cachedContainer;
  }

  const hasDatabase = Boolean(env.DATABASE_URL);

  const transactionRepository = hasDatabase ? new PrismaTransactionRepository() : new MemoryTransactionRepository();
  const budgetRepository = hasDatabase ? new PrismaBudgetRepository() : new MemoryBudgetRepository();
  const categoryRepository = hasDatabase ? new PrismaCategoryRepository() : new MemoryCategoryRepository();
  const ruleRepository = hasDatabase ? new PrismaRuleRepository() : new MemoryRuleRepository();
  const userBucketRepository = hasDatabase ? new PrismaUserBucketRepository() : new MemoryUserBucketRepository();
  const incomeRepository = hasDatabase ? new PrismaIncomeRepository() : new MemoryIncomeRepository();
  const scheduledTransactionRepository = hasDatabase
    ? new PrismaScheduledTransactionRepository()
    : new MemoryScheduledTransactionRepository();
  const draftRepository = hasDatabase ? new PrismaTransactionDraftRepository() : new MemoryTransactionDraftRepository();
  const userRepository = hasDatabase ? new PrismaUserRepository() : new MemoryUserRepository();
  const gmailCredentialRepository = hasDatabase ? new PrismaGmailCredentialRepository() : new MemoryGmailCredentialRepository();

  const hasGlobalGmailCredentials = Boolean(env.GMAIL_CLIENT_ID && env.GMAIL_CLIENT_SECRET && env.GMAIL_REFRESH_TOKEN);
  const fallbackEmailProvider = hasGlobalGmailCredentials
    ? new GmailProvider({
        clientId: env.GMAIL_CLIENT_ID!,
        clientSecret: env.GMAIL_CLIENT_SECRET!,
        refreshToken: env.GMAIL_REFRESH_TOKEN!,
      })
    : new MockEmailProvider();

  if (!hasGlobalGmailCredentials) {
    console.warn("[email] Gmail credentials missing, falling back to MockEmailProvider.");
  }

  const emailProviderResolver = new EmailProviderResolver(gmailCredentialRepository, {
    fallbackProvider: fallbackEmailProvider,
  });
  const emailIngestionService = new EmailIngestionService(
    [
      new BancoPopularAdapter(),
      new BancoSantaCruzAdapter(),
      new AsociacionCibaoAdapter(),
      new QikAdapter(),
      new GenericBankAdapter(),
    ],
    transactionRepository,
    draftRepository,
    categoryRepository,
    ruleRepository,
    userBucketRepository,
    userRepository,
  );

  const financialStatsUseCase = new GetFinancialStatsUseCase(transactionRepository, incomeRepository, categoryRepository);

  cachedContainer = {
    getDashboardSummaryUseCase: new GetDashboardSummaryUseCase(
      budgetRepository,
      transactionRepository,
      categoryRepository,
      userBucketRepository,
    ),
    listTransactionsUseCase: new ListTransactionsUseCase(transactionRepository),
    listCategoriesUseCase: new ListCategoriesUseCase(categoryRepository),
    listRulesUseCase: new ListRulesUseCase(ruleRepository),
    processIncomingEmailsUseCase: new ProcessIncomingEmailsUseCase(emailIngestionService, emailProviderResolver),
    upsertBudgetUseCase: new UpsertBudgetUseCase(budgetRepository, userBucketRepository),
    createCategoryUseCase: new CreateCategoryUseCase(categoryRepository),
    updateCategoryUseCase: new UpdateCategoryUseCase(categoryRepository),
    deleteCategoryUseCase: new DeleteCategoryUseCase(categoryRepository),
    createRuleUseCase: new CreateRuleUseCase(ruleRepository),
    updateRuleUseCase: new UpdateRuleUseCase(ruleRepository),
    deleteRuleUseCase: new DeleteRuleUseCase(ruleRepository),
    createTransactionUseCase: new CreateTransactionUseCase(transactionRepository),
    updateTransactionUseCase: new UpdateTransactionUseCase(transactionRepository),
    deleteTransactionUseCase: new DeleteTransactionUseCase(transactionRepository),
    createIncomeUseCase: new CreateIncomeUseCase(incomeRepository, budgetRepository, userBucketRepository),
    updateIncomeUseCase: new UpdateIncomeUseCase(incomeRepository, budgetRepository, userBucketRepository),
    deleteIncomeUseCase: new DeleteIncomeUseCase(incomeRepository, budgetRepository, userBucketRepository),
    listIncomesUseCase: new ListIncomesUseCase(incomeRepository),
    getYearlyOverviewUseCase: new GetYearlyOverviewUseCase(incomeRepository, transactionRepository),
    createScheduledTransactionUseCase: new CreateScheduledTransactionUseCase(scheduledTransactionRepository),
    listScheduledTransactionsUseCase: new ListScheduledTransactionsUseCase(scheduledTransactionRepository),
    runScheduledTransactionsUseCase: new RunScheduledTransactionsUseCase(
      scheduledTransactionRepository,
      transactionRepository,
    ),
    deleteScheduledTransactionUseCase: new DeleteScheduledTransactionUseCase(scheduledTransactionRepository),
    listTransactionDraftsUseCase: new ListTransactionDraftsUseCase(draftRepository),
    approveTransactionDraftUseCase: new ApproveTransactionDraftUseCase(draftRepository, transactionRepository, categoryRepository),
    deleteTransactionDraftUseCase: new DeleteTransactionDraftUseCase(draftRepository),
    getFinancialStatsUseCase: financialStatsUseCase,
    userRepository,
    userBucketRepository,
    gmailCredentialRepository,
  };

  return cachedContainer;
}
