import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        source: true,
        assignedTo: true,
        convertedClient: true,
        deals: { include: { product: true } },
        followups: { orderBy: { scheduledAt: "asc" } },
        activities: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const sources = await prisma.leadSource.findMany({ where: { isActive: true } });
    const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });
    const products = await prisma.product.findMany();

    return NextResponse.json({ lead, sources, employees, products });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const body = await req.json();
    const updated = await prisma.lead.update({
      where: { id },
      data: {
        businessName: body.businessName !== undefined ? body.businessName : existing.businessName,
        contactPerson: body.contactPerson !== undefined ? body.contactPerson : existing.contactPerson,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        whatsapp: body.whatsapp !== undefined ? body.whatsapp : existing.whatsapp,
        email: body.email !== undefined ? body.email : existing.email,
        website: body.website !== undefined ? body.website : existing.website,
        address: body.address !== undefined ? body.address : existing.address,
        city: body.city !== undefined ? body.city : existing.city,
        country: body.country !== undefined ? body.country : existing.country,
        businessCategory: body.businessCategory !== undefined ? body.businessCategory : existing.businessCategory,
        interestedProduct: body.interestedProduct !== undefined ? body.interestedProduct : existing.interestedProduct,
        sourceId: body.sourceId !== undefined ? body.sourceId : existing.sourceId,
        assignedToId: body.assignedToId !== undefined ? body.assignedToId : existing.assignedToId,
        status: body.status !== undefined ? body.status : existing.status,
        priority: body.priority !== undefined ? body.priority : existing.priority,
        estimatedValue: body.estimatedValue !== undefined ? Number(body.estimatedValue) : existing.estimatedValue,
        lastContactedAt: body.lastContactedAt ? new Date(body.lastContactedAt) : existing.lastContactedAt,
        nextFollowUpAt: body.nextFollowUpAt ? new Date(body.nextFollowUpAt) : existing.nextFollowUpAt,
      },
    });

    if (existing.status !== updated.status) {
      await logActivity({
        userId: user.id,
        userName: user.name,
        module: "LEAD",
        event: "STATUS_CHANGED",
        leadId: updated.id,
        recordId: updated.id,
        description: `Lead status changed from ${existing.status} to ${updated.status}.`,
      });
    }

    await logAudit({
      userId: user.id,
      action: "UPDATE",
      entity: "Lead",
      entityId: id,
      oldValues: existing,
      newValues: updated,
    });

    return NextResponse.json({ success: true, lead: updated });
  } catch (err: any) {
    console.error("PUT /api/crm/leads/[id] error:", err);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    await prisma.lead.delete({ where: { id } });

    await logAudit({
      userId: user.id,
      action: "DELETE",
      entity: "Lead",
      entityId: id,
      oldValues: existing,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
