import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const sourceId = searchParams.get("sourceId");
    const search = searchParams.get("search")?.trim();

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (sourceId && sourceId !== "ALL") where.sourceId = sourceId;
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { leadCode: { contains: search } },
      ];
    }

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        source: true,
        assignedTo: { select: { id: true, name: true, email: true } },
        convertedClient: { select: { id: true, clientCode: true, businessName: true } },
        _count: { select: { followups: true, activities: true, deals: true } },
      },
    });

    const sources = await prisma.leadSource.findMany({ where: { isActive: true } });
    const employees = await prisma.employee.findMany({ where: { status: "ACTIVE" } });

    return NextResponse.json({ leads, sources, employees });
  } catch (err: any) {
    console.error("GET /api/crm/leads error:", err);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      businessName,
      contactPerson,
      phone,
      whatsapp,
      email,
      website,
      address,
      city = "Karachi",
      country = "Pakistan",
      businessCategory,
      interestedProduct,
      sourceId,
      assignedToId,
      status = "NEW",
      priority = "MEDIUM",
      estimatedValue = 0,
      notes,
    } = body;

    if (!businessName?.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    // Duplicate detection check
    const existing = await prisma.lead.findFirst({
      where: {
        OR: [
          { businessName: { equals: businessName.trim() } },
          ...(phone ? [{ phone: { equals: phone.trim() } }] : []),
          ...(email ? [{ email: { equals: email.trim().toLowerCase() } }] : []),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: `Duplicate prospect detected: Lead ${existing.leadCode} already exists for "${existing.businessName}".`,
          duplicateId: existing.id,
        },
        { status: 409 }
      );
    }

    // Generate lead code: LD-1001 + count
    const count = await prisma.lead.count();
    const leadCode = `LD-${1001 + count}`;

    const lead = await prisma.lead.create({
      data: {
        leadCode,
        businessName: businessName.trim(),
        contactPerson,
        phone,
        whatsapp: whatsapp || phone,
        email: email?.trim().toLowerCase() || null,
        website,
        address,
        city,
        country,
        businessCategory,
        interestedProduct,
        sourceId: sourceId || null,
        assignedToId: assignedToId || null,
        status,
        priority,
        estimatedValue: Number(estimatedValue) || 0,
      },
    });

    // If initial notes provided, log as first activity
    if (notes) {
      await logActivity({
        userId: user.id,
        userName: user.name,
        module: "LEAD",
        event: "NOTE_ADDED",
        leadId: lead.id,
        recordId: lead.id,
        description: `Initial note for ${lead.businessName}: ${notes}`,
      });
    }

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "LEAD",
      event: "LEAD_CREATED",
      leadId: lead.id,
      recordId: lead.id,
      description: `Created new lead ${lead.leadCode} (${lead.businessName}) with status ${status}.`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Lead",
      entityId: lead.id,
      newValues: lead,
    });

    return NextResponse.json({ success: true, lead });
  } catch (err: any) {
    console.error("POST /api/crm/leads error:", err);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
