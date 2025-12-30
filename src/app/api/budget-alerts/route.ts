import { format } from "date-fns";
import { NextResponse } from "next/server";
import { serverContainer } from "@/infrastructure/config/server-container";
import { requireAuth } from "@/lib/auth/require-auth";
import { Transaction } from "@/domain/transactions/transaction";
import { Category } from "@/domain/categories/category";
import { Bucket } from "@/domain/value-objects/bucket";

type BudgetAlert = {
  id: string;
  categoryName: string;
  bucket: Bucket;
  level: "warning" | "danger" | "success";
  planned: number;
  spent: number;
  ratio: number;
};

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");
    const monthRegex = /^\d{4}-\d{2}$/;
    const month = monthParam && monthRegex.test(monthParam) ? monthParam : format(new Date(), "yyyy-MM");

    const { appUser } = await requireAuth();
    const container = serverContainer();

    const [transactions, categories] = await Promise.all([
      container.listTransactionsUseCase.execute({ userId: appUser.id, monthId: month }),
      container.listCategoriesUseCase.execute(appUser.id),
    ]);

    const alerts = buildCategoryAlerts(categories, transactions);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error("Failed to load budget alerts", error);
    return NextResponse.json({ alerts: [], error: "No se pudieron cargar las alertas." }, { status: 500 });
  }
}

function buildCategoryAlerts(categories: Category[], transactions: Transaction[]): BudgetAlert[] {
  const spendingByCategory = transactions.reduce<Record<string, number>>((acc, transaction) => {
    if (transaction.amount >= 0 || transaction.source === "SCHEDULED") {
      return acc;
    }
    const key = transaction.categoryId ?? "uncategorized";
    const current = acc[key] ?? 0;
    acc[key] = current + Math.abs(transaction.amount);
    return acc;
  }, {});

  return categories
    .map<BudgetAlert | null>((category) => {
      const planned = category.idealMonthlyAmount ?? 0;
      if (planned <= 0) {
        return null;
      }
      const spent = spendingByCategory[category.id] ?? 0;
      if (spent <= 0) {
        return null;
      }
      const ratio = spent / planned;
      if (category.bucket === "SAVINGS") {
        if (ratio < 0.8) {
          return null;
        }
        return {
          id: category.id,
          categoryName: category.name,
          bucket: category.bucket,
          level: ratio >= 1 ? "success" : "warning",
          planned,
          spent,
          ratio,
        };
      }
      if (ratio < 0.8) {
        return null;
      }
      return {
        id: category.id,
        categoryName: category.name,
        bucket: category.bucket,
        level: ratio >= 1 ? "danger" : "warning",
        planned,
        spent,
        ratio,
      };
    })
    .filter((alert): alert is BudgetAlert => Boolean(alert))
    .sort((a, b) => b.ratio - a.ratio);
}
