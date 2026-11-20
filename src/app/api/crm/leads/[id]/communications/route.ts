import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const { type, description, nextFollowUpDate } = body;

    if (!description?.trim()) {
      return NextResponse.json({ error: "Note / summary is required" }, { status: 400 });
    }

    // Log the communication activity
    const activity = await logActivity({
      userId: user.id,
      userName: user.name,
      module: "LEAD",
      event: `COMMUNICATION_${type || "NOTE"}`,
      leadId: id,
      recordId: id,
      description: `[${type || "NOTE"}] ${description}`,
    });

    // Update lead lastContactedAt
    await prisma.lead.update({
      where: { id },
      data: {
        lastContactedAt: new Date(),
        ...(nextFollowUpDate ? { nextFollowUpAt: new Date(nextFollowUpDate) } : {}),
      },
    });

    // If next follow-up date was specified, schedule a follow-up record
    if (nextFollowUpDate) {
      await prisma.followup.create({
        data: {
          leadId: id,
          scheduledAt: new Date(nextFollowUpDate),
          type: type === "CALL" ? "CALL" : type === "WHATSAPP" ? "WHATSAPP" : "MEETING",
          notes: `Follow-up after ${type}: ${description}`,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json({ success: true, activity });
  } catch (err: any) {
    console.error("POST communications error:", err);
    return NextResponse.json({ error: "Failed to log interaction" }, { status: 500 });
  }
}
