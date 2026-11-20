import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
      include: { category: true },
    });

    const categories = await prisma.expenseCategory.findMany();

    return NextResponse.json({ expenses, categories });
  } catch (err: any) {
    console.error("GET /api/finance/expenses error:", err);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, categoryId, amount, date = new Date(), paymentMethod = "BANK_TRANSFER", vendor, description } = body;

    if (!title?.trim() || !amount) {
      return NextResponse.json({ error: "Title and amount are required" }, { status: 400 });
    }

    const count = await prisma.expense.count();
    const expenseCode = `EXP-${8001 + count}`;

    const expense = await prisma.expense.create({
      data: {
        expenseCode,
        title: title.trim(),
        categoryId: categoryId || null,
        amount: Number(amount),
        currency: "PKR",
        date: new Date(date),
        paymentMethod,
        vendor,
        description,
        createdBy: user.name,
      },
      include: { category: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "EXPENSE_RECORDED",
      recordId: expense.id,
      description: `Recorded operating expense: ${expense.title} (PKR ${expense.amount.toLocaleString()}) under ${expense.category?.name || "General"}.`,
    });

    return NextResponse.json({ success: true, expense });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to record expense" }, { status: 500 });
  }
}
