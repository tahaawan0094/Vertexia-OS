import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "ALL";

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const where: any = {};

    if (filter === "TODAY") {
      where.scheduledAt = { gte: startOfToday, lte: endOfToday };
      where.status = "PENDING";
    } else if (filter === "OVERDUE") {
      where.scheduledAt = { lt: startOfToday };
      where.status = "PENDING";
    } else if (filter === "UPCOMING") {
      where.scheduledAt = { gt: endOfToday };
      where.status = "PENDING";
    } else if (filter === "COMPLETED") {
      where.status = "COMPLETED";
    }

    const followups = await prisma.followup.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
      include: {
        lead: { select: { id: true, leadCode: true, businessName: true, phone: true } },
        client: { select: { id: true, clientCode: true, businessName: true, phone: true } },
      },
    });

    const [todayCount, overdueCount, upcomingCount, completedCount] = await Promise.all([
      prisma.followup.count({
        where: { scheduledAt: { gte: startOfToday, lte: endOfToday }, status: "PENDING" },
      }),
      prisma.followup.count({
        where: { scheduledAt: { lt: startOfToday }, status: "PENDING" },
      }),
      prisma.followup.count({
        where: { scheduledAt: { gt: endOfToday }, status: "PENDING" },
      }),
      prisma.followup.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      followups,
      counts: {
        today: todayCount,
        overdue: overdueCount,
        upcoming: upcomingCount,
        completed: completedCount,
      },
    });
  } catch (err: any) {
    console.error("GET followups error:", err);
    return NextResponse.json({ error: "Failed to fetch follow-ups" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, status, scheduledAt, notes } = await req.json();

    const data: any = {};
    if (status) {
      data.status = status;
      if (status === "COMPLETED") data.completedAt = new Date();
    }
    if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
    if (notes) data.notes = notes;

    const followup = await prisma.followup.update({
      where: { id },
      data,
      include: { lead: true, client: true },
    });

    if (status === "COMPLETED") {
      await logActivity({
        userId: user.id,
        userName: user.name,
        module: followup.leadId ? "LEAD" : "CLIENT",
        event: "FOLLOWUP_COMPLETED",
        leadId: followup.leadId,
        clientId: followup.clientId,
        recordId: followup.id,
        description: `Completed follow-up for ${followup.lead?.businessName || followup.client?.businessName || "Contact"}.`,
      });
    }

    return NextResponse.json({ success: true, followup });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to update follow-up" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Followup ID required" }, { status: 400 });

    const followup = await prisma.followup.findUnique({ where: { id } });
    if (!followup) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 });

    await prisma.followup.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete follow-up" }, { status: 500 });
  }
}
