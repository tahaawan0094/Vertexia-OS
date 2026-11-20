import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const setting = await prisma.companySetting.findFirst();
    const leadSources = await prisma.leadSource.findMany();
    const expenseCategories = await prisma.expenseCategory.findMany();

    return NextResponse.json({ setting, leadSources, expenseCategories });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const existing = await prisma.companySetting.findFirst();

    if (!existing) {
      const created = await prisma.companySetting.create({ data: body });
      return NextResponse.json({ success: true, setting: created });
    }

    const updated = await prisma.companySetting.update({
      where: { id: existing.id },
      data: body,
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "SYSTEM",
      event: "SETTINGS_UPDATED",
      description: "Updated company business parameters and invoice prefixes.",
    });

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Setting",
      entityId: existing.id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, setting: updated });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
