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
    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) {
      where.OR = [
        { businessName: { contains: search } },
        { contactPerson: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
        { clientCode: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        branches: true,
        installations: {
          include: { product: true, license: true },
        },
        invoices: {
          select: { totalAmount: true, paidAmount: true, status: true },
        },
        _count: { select: { tickets: true, branches: true, installations: true } },
      },
    });

    // Compute live financial totals per client
    const clientsWithTotals = clients.map((c) => {
      const totalInvoiced = c.invoices
        .filter((i) => i.status !== "CANCELLED")
        .reduce((sum, i) => sum + i.totalAmount, 0);
      const totalPaid = c.invoices
        .filter((i) => i.status !== "CANCELLED")
        .reduce((sum, i) => sum + i.paidAmount, 0);
      const balance = Math.max(0, totalInvoiced - totalPaid);

      return {
        ...c,
        totalInvoiced,
        totalPaid,
        balance,
        installationCount: c.installations.length,
      };
    });

    return NextResponse.json({ clients: clientsWithTotals });
  } catch (err: any) {
    console.error("GET /api/clients error:", err);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      businessName,
      businessCategory,
      contactPerson,
      phone,
      whatsapp,
      email,
      address,
      city = "Karachi",
      country = "Pakistan",
      branchName = "Main Branch",
      notes,
    } = body;

    if (!businessName?.trim()) {
      return NextResponse.json({ error: "Business name is required" }, { status: 400 });
    }

    const count = await prisma.client.count();
    const clientCode = `CLI-${3001 + count}`;

    const client = await prisma.client.create({
      data: {
        clientCode,
        businessName: businessName.trim(),
        businessCategory,
        contactPerson: contactPerson || businessName.trim(),
        phone: phone || "N/A",
        whatsapp: whatsapp || phone,
        email: email?.trim().toLowerCase() || null,
        address,
        city,
        country,
        status: "ACTIVE",
        notes,
        branches: {
          create: {
            name: branchName,
            code: "BR-01",
            address,
            city,
            contactPerson,
            phone,
          },
        },
      },
      include: { branches: true },
    });

    await logActivity({
      userId: user.id,
      userName: user.name,
      module: "CLIENT",
      event: "CLIENT_CREATED",
      clientId: client.id,
      recordId: client.id,
      description: `Created new client ${client.clientCode} (${client.businessName}) with main branch.`,
    });

    await logAudit({
      userId: user.id,
      action: "CREATE",
      entity: "Client",
      entityId: client.id,
      newValues: client,
    });

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error("POST /api/clients error:", err);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
