import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.expense.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    await prisma.expense.delete({ where: { id } });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "EXPENSE_DELETED",
      recordId: id,
      description: `Deleted expense record: ${existing.title} (${existing.amount} PKR).`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
